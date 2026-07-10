import { Request, Response } from "express";
import fs from "fs";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { terminJobService } from "@/services/createTermin.service";
import { hitungBiayaJobService } from "@/services/hitungBiaya.service";
import { KeluargaJobService } from "@/services/keluarga.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import { PdfService } from "@/services/pdf.service";
import {
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { DokumenTermin, PegawaiMutasi, SuratKeputusan, Termin, Timeline } from "@/repositories";

export const SuratKeputusanControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const jenjang = (req.query.jenjang as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search)
      where[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];
    if (jenjang) where.jenjang = jenjang.toUpperCase();
    if (status) where.status = status.toLocaleUpperCase();
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { items: data, pagination } = await SuratKeputusan.findAllWithPagination({
      where,
      order,
      limit,
      offset,
    });

    successResponse(res, "Berhasil mendapatkan data surat keputusan", data, pagination);
  }),
  count: asyncHandler(async (req: Request, res: Response) => {
    const jenjang = (req.query.jenjang as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search)
      where[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];
    if (jenjang) where.jenjang = jenjang.toUpperCase();
    if (status) where.status = status.toLocaleUpperCase();
    const count = await SuratKeputusan.count({
      where,
    });
    successResponse(res, "Berhasil mendapatkan jumlah data surat keputusan", { count });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.findById(SkId, {
      include: [
        {
          association: "Timeline",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM pegawai_mutasi WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "jumlah_pegawai",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(monitoring_tagihan.total_tagihan), 0) FROM pegawai_mutasi JOIN monitoring_tagihan ON monitoring_tagihan.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "total_tagihan",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(monitoring_tagihan.total_termin), 0) FROM pegawai_mutasi JOIN monitoring_tagihan ON monitoring_tagihan.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "total_termin",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(monitoring_tagihan.sisa_tagihan), 0) FROM pegawai_mutasi JOIN monitoring_tagihan ON monitoring_tagihan.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "sisa_tagihan",
          ],
        ],
      },
    });

    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }

    successResponse(res, "Berhasil mendapatkan data surat keputusan", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { nomor, uraian, tanggal, tmt, jenjang } = req.body;
    const file = req.file;

    if (!file) {
      throw new InvalidRequestError("File tidak ditemukan");
    }

    const fileName = UUID.v4();

    if (file?.path) {
      const buffer = fs.readFileSync(file.path);
      await minioService.uploadFile(buffer, `suratKeputusan/${fileName}.pdf`, "application/pdf");
    }

    const data = await SuratKeputusan.create({
      nomor,
      uraian,
      tanggal,
      tmt,
      jenjang,
      file: `suratKeputusan/${fileName}.pdf`,
    });

    successResponse(res, "Berhasil membuat data surat keputusan", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { SkId } = req.params;
      const { nomor, uraian, tanggal, tmt, jenjang, status } = req.body;
      const file = req.file;

      const data = await SuratKeputusan.updateOne(
        {
          where: {
            id: SkId,
            status: "DRAFT",
          },
        },
        {
          nomor,
          uraian,
          tanggal,
          tmt,
          jenjang,
          status,
        },
        t
      );

      if (file) {
        const buffer = fs.readFileSync(file.path);
        await minioService.uploadFile(buffer, `${data.file}`, "application/pdf");
      }
      successResponse(res, "Berhasil memperbarui data surat keputusan", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { SkId } = req.params;
      if (typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await SuratKeputusan.deleteOne(
        {
          where: {
            id: SkId,
            status: "DRAFT",
          },
        },
        t
      );
      successResponse(res, "Berhasil menghapus data surat keputusan", data);
    },
    {
      useTransaction: true,
    }
  ),
  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.findById(SkId);

    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }

    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.nomor.replace(/\//g, "_")}.pdf`, "application/pdf");
  }),
  getPegawais: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await SuratKeputusan.findById(SkId, {
      include: [
        {
          association: "Pegawai",
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    successResponse(res, "Berhasil mendapatkan data pegawai", data);
  }),
  processKeluarga: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { SkId } = req.params;
      if (typeof SkId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const ids = await SuratKeputusan.processKeluarga(SkId, t);

      await KeluargaJobService.addBatchJob(ids);
      successResponse(res, "Berhasil memproses data keluarga", {
        SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
  hitungBiaya: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { SkId } = req.params;
      if (typeof SkId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const ids = await SuratKeputusan.hitungBiaya(SkId, t);

      await hitungBiayaJobService.addBatchJob(ids);
      successResponse(res, "Berhasil memproses data biaya", {
        SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
  processTermin: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { SkId } = req.params;
      if (typeof SkId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { percentage, maximum, tahun_uang_muka, tahun_lunas, type } = req.body;
      const ids = await SuratKeputusan.processTermin(SkId, t);

      if (type === "UANG_MUKA") {
        const pegawai = ids.map((id) => {
          return {
            id: id,
            percentage: percentage,
            maximum: maximum,
            tahun_uang_muka: tahun_uang_muka,
            tahun_lunas: tahun_lunas,
            type: type,
          };
        });
        await terminJobService.addBatchJobs(pegawai);
      } else {
        const pegawai = ids.map((id) => {
          return {
            id: id,
            tahun_uang_muka: tahun_lunas,
            tahun_lunas: tahun_lunas,
            type: type,
          };
        });
        await terminJobService.addBatchJobs(pegawai);
      }
      successResponse(res, "Berhasil memproses data termin", {
        SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
  publish: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
      }

      const { SkId } = req.params;
      if (typeof SkId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await SuratKeputusan.publish(SkId, t);

      await PegawaiMutasi.update(
        { status: "PENDING_APROVAL" },
        { where: { sk_id: SkId }, transaction: t }
      );
      await Logger.BatchGeneralAction({
        pegawai_ids: data.Pegawai.map((p) => p.id),
        actor_nip: nip,
        actor_role: "SDM",
        action: "Publish Surat Keputusan",
        description: null,
        transaction: t,
      });
      await AlikaService.sendBulkPushNotification({
        nip: data.Pegawai.map((p) => p.nip),
        title: "Surat Keputusan Mutasi",
        message:
          "Selamat kami ucapkan kepada Bapak/Ibu atas tugas baru yang diberikan, dalam rangka mempercepat proses pembayaran kami harapkan Bapak/Ibu dapat segera melakukan aproval data keluarga pada aplikasi Alika. Terima Kasih🙏",
      });

      successResponse(res, "Berhasil mempublish data surat keputusan", data);
    },
    {
      useTransaction: true,
    }
  ),
  setTimeline: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { SkId } = req.params;
      if (typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { timeline_sanggah, timeline_verifikasi, timeline_spm } = req.body;

      await Timeline.setTimeline(SkId, timeline_sanggah, timeline_verifikasi, timeline_spm, t);
      successResponse(res, "Berhasil memperbarui timeline");
    },
    {
      useTransaction: true,
    }
  ),
  getOverview: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const { data, summary } = await SuratKeputusan.getOverview({
      where: {
        id: SkId,
      },
    });

    const pdf = await PdfService.OverviewSK({ data, summary });
    const pdfBuffer = Buffer.from(pdf, "base64");
    res.setHeader("Content-Type", "application/pdf");
    fileResponse(res, pdfBuffer, `${data.nomor.replace(/\//g, "_")}.pdf`, "application/pdf");
  }),
  getOverviewCSV: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const { data } = await SuratKeputusan.getOverview({
      where: {
        id: SkId,
      },
    });
    const { Pegawai } = data;
    const csvData = Pegawai.sort((a, b) => {
      return a.golongan.localeCompare(b.golongan);
    }).map((pegawai, index) => {
      return {
        no: index + 1,
        nip: pegawai.nip,
        nama: pegawai.nama,
        golongan: pegawai.Golongan,
        jumlah_tanggungan: pegawai.Keluarga.filter(
          (k) => k.status.toLocaleLowerCase() === "tertanggung"
        ).length,
        kantor_asal: pegawai.KantorAsal
          ? `${pegawai.KantorAsal.kantor} - ${pegawai.KantorAsal.Kota.kota}`
          : "",
        kantor_tujuan: pegawai.KantorTujuan
          ? `${pegawai.KantorTujuan.kantor} - ${pegawai.KantorTujuan.Kota.kota}`
          : "",
        total_biaya: pegawai.MonitoringTagihan ? pegawai.MonitoringTagihan.total_tagihan : 0,
      };
    });

    const headers = Array.from(new Set(csvData.flatMap((obj) => Object.keys(obj))));
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => JSON.stringify((row as Record<string, any>)[header] || ""))
          .join(",")
      ),
    ].join("\n");

    const csvBuffer = Buffer.from(csvContent, "utf-8");
    fileResponse(res, csvBuffer, `${data.nomor.replace(/\//g, "_")}.csv`, "text/csv");
  }),
  batal: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
      }

      const { SkId } = req.params;
      if (typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await SuratKeputusan.findById(SkId, {
        include: [
          {
            association: "Pegawai",
            include: [
              {
                association: "Termin",
                include: [
                  {
                    association: "DokumenTermin",
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }

      if (data.status !== "PUBLISH") {
        throw new AuthorizationError("Surat Keputusan tidak dalam status PUBLISH");
      }

      for (const pegawai of data.Pegawai) {
        for (const termin of pegawai.Termin) {
          for (const dokumen of termin.DokumenTermin) {
            if (dokumen.file) {
              await minioService.deleteFile(dokumen.file);
            }
          }
        }
      }

      await PegawaiMutasi.update(
        {
          status: "DRAFT",
        },
        { where: { sk_id: SkId }, transaction: t }
      );
      const pegawai = data.Pegawai.map((pegawai) => pegawai.id);
      await Termin.update(
        {
          status: "DRAFT",
        },
        { where: { pegawai_id: pegawai }, transaction: t }
      );
      data.status = "DRAFT";
      await data.save({ transaction: t });
      const termin = data.Pegawai.flatMap((pegawai) => pegawai.Termin);
      await DokumenTermin.delete(
        {
          where: {
            termin_id: termin.map((t) => t.id),
          },
        },
        t
      );

      await Logger.BatchGeneralAction({
        pegawai_ids: data.Pegawai.map((p) => p.id),
        actor_nip: nip,
        actor_role: "SDM",
        action: "Publish Surat Keputusan",
        description: null,
        transaction: t,
      });

      await AlikaService.sendBulkPushNotification({
        nip: data.Pegawai.map((p) => p.nip),
        title: "Surat Keputusan Mutasi",
        message:
          "Surat Keputusan Mutasi telah dibatalkan oleh Bagian SDM, karena ada kesalahan teknis",
      });

      successResponse(res, "Berhasil membatalkan surat keputusan", {
        id: SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
  selesai: asyncHandler(
    async (req: Request, res: Response) => {
      const t = await sequelize.transaction();
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { SkId } = req.params;
      if (typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await SuratKeputusan.findById(SkId, {
        include: [
          {
            association: "Pegawai",
            include: [
              {
                association: "Termin",
                include: [
                  {
                    association: "DokumenTermin",
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }

      if (data.status !== "PUBLISH") {
        throw new AuthorizationError("Surat Keputusan tidak dalam status PUBLISH");
      }

      const termin = data.Pegawai.flatMap((pegawai) => pegawai.Termin);

      const allTerminPaid = termin.every((t) => t.status === "PAID");

      if (!allTerminPaid) {
        throw new AuthorizationError("Masih terdapat termin yang belum dibayar");
      }
      data.status = "SELESAI";
      await data.save({ transaction: t });
      successResponse(res, "Surat Keputusan berhasil diselesaikan", {
        id: SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
};
