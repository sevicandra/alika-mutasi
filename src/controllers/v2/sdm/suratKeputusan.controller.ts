import {
  SuratKeputusan,
  PegawaiMutasi,
  Timeline,
  DokumenTermin,
  Termin,
} from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { MinioService } from "@/services/minio.service";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import { KeluargaJobService } from "@/services/keluarga.service";
import { hitungBiayaJobService } from "@/services/hitungBiaya.service";
import { terminJobService } from "@/services/createTermin.service";
import { Logger } from "@/services/log.service";
import { AlikaService } from "@/services/alika.service";
import { PdfService } from "@/services/pdf.service";

const minioService = new MinioService();

export const getAllSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
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
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const { rows: data, count } = await SuratKeputusan.findAndCountAll({
      where,
      limit,
      offset,
      order,
    });
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data,
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const countAllSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
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
    if (jenjang) where.jenjang = jenjang;
    if (status) where.status = status;

    const count = await SuratKeputusan.count({ where });
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      count
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getSuratKeputusanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
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
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const createSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nomor, uraian, tanggal, tmt, jenjang } = req.body;
    const file = req.file;
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];

    if (!nomor)
      ValidationError.push({
        field: "nomor",
        message: "Nomor tidak boleh kosong",
      });
    if (!uraian)
      ValidationError.push({
        field: "uraian",
        message: "Uraian tidak boleh kosong",
      });
    if (!tanggal)
      ValidationError.push({
        field: "tanggal",
        message: "Tanggal tidak boleh kosong",
      });
    if (!tmt)
      ValidationError.push({ field: "tmt", message: "TMT tidak boleh kosong" });
    if (!jenjang)
      ValidationError.push({
        field: "jenjang",
        message: "Jenjang tidak boleh kosong",
      });
    if (!file)
      ValidationError.push({
        field: "file",
        message: "File tidak boleh kosong",
      });

    if (ValidationError.length > 0) {
      return errorResponse(
        res,
        "Parameter tidak lengkap",
        ValidationError,
        422
      );
    }

    const fileName = UUID.v4();

    await minioService.uploadFile(
      file?.buffer,
      `suratKeputusan/${fileName}.pdf`
    );

    const data = await SuratKeputusan.create({
      nomor,
      uraian,
      tanggal,
      tmt,
      jenjang,
      file: `suratKeputusan/${fileName}.pdf`,
    });

    return successResponse(res, "Berhasil membuat data surat keputusan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const { nomor, uraian, tanggal, tmt, jenjang, status } = req.body;
    const file = req.file;
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }

    if (data.Pegawai.some((pegawai) => pegawai.process_keluarga !== "IDLE")) {
      return errorResponse(res, "Pegawai sudah dalam proses", null, 400);
    }

    if (file) {
      await minioService.uploadFile(file.buffer, `${data.file}`);
    }
    if (nomor) data.nomor = nomor;
    if (uraian) data.uraian = uraian;
    if (tanggal) data.tanggal = tanggal;
    if (tmt) data.tmt = tmt;
    if (jenjang) data.jenjang = jenjang;
    if (status) data.status = status;
    await data.save();

    return successResponse(
      res,
      "Berhasil memperbarui data surat keputusan",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }

    await data.destroy();
    return successResponse(res, "Berhasil menghapus data surat keputusan", {
      id: SkId,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getSuratKeputusanFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const stream = await minioService.downloadFile(`${data.file}`);
    if (stream) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${data.nomor.replace(/\//g, "_")}.pdf"`
        );
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    }
  } catch (error: unknown) {
    next(error);
  }
};

export const getPegawaiSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data, 200);
  } catch (error: unknown) {
    next(error);
  }
};

export const processKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "IDLE",
            status: "DRAFT",
          },
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }
    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      return errorResponse(res, "Tidak ada pegawai yang terkait", null, 404);
    }
    await KeluargaJobService.addBatchJob(ids);
    return successResponse(res, "Berhasil memproses data keluarga", {
      id: SkId,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const processBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "DONE",
            process_biaya: "IDLE",
            status: "DRAFT",
          },
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }

    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      return errorResponse(res, "Tidak ada pegawai yang terkait", null, 404);
    }
    await hitungBiayaJobService.addBatchJob(ids);
    return successResponse(res, "Berhasil memproses data biaya", {
      id: SkId,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const processTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const { percentage, maximum, tahun_uang_muka, tahun_lunas } = req.body;
    const type = req.body.type as "UANG_MUKA" | "LUNAS";
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];
    if (type !== "UANG_MUKA" && type !== "LUNAS") {
      return errorResponse(res, "Type harus UANG_MUKA atau LUNAS", null, 400);
    }
    if (type === "UANG_MUKA") {
      if (!percentage)
        ValidationError.push({
          field: "percentage",
          message: "Persentase tidak boleh kosong",
        });

      if (percentage < 0 || percentage > 100)
        ValidationError.push({
          field: "percentage",
          message: "Persentase harus antara 0 sampai 100",
        });

      if (!tahun_uang_muka)
        ValidationError.push({
          field: "tahun_uang_muka",
          message: "Tahun uang muka tidak boleh kosong",
        });
    }
    if (!tahun_lunas)
      ValidationError.push({
        field: "tahun_lunas",
        message: "Tahun lunas tidak boleh kosong",
      });
    if (ValidationError.length > 0) {
      return errorResponse(res, "Validation gagal", ValidationError, 422);
    }
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "DONE",
            process_biaya: "DONE",
            process_termin: "IDLE",
            status: "DRAFT",
          },
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }
    if (type === "UANG_MUKA") {
      const pegawai = data.Pegawai.map((pegawai) => {
        return {
          id: pegawai.id,
          percentage: percentage,
          maximum: maximum,
          tahun_uang_muka: tahun_uang_muka,
          tahun_lunas: tahun_lunas,
          type: type,
        };
      });
      await terminJobService.addBatchJobs(pegawai);
    } else {
      const pegawai = data.Pegawai.map((pegawai) => {
        return {
          id: pegawai.id,
          tahun_uang_muka: tahun_lunas,
          tahun_lunas: tahun_lunas,
          type: type,
        };
      });
      await terminJobService.addBatchJobs(pegawai);
    }
    return successResponse(res, "Berhasil memproses data termin", {
      id: SkId,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const publishSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { SkId } = req.params;
    const { nip } = req.user;
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
          attributes: [
            "id",
            "nip",
            "process_keluarga",
            "process_biaya",
            "process_termin",
          ],
          include: [
            {
              association: "MonitoringTagihan",
            },
          ],
        },
        {
          association: "Timeline",
        },
      ],
    });

    if (!data) {
      await t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (data.status !== "DRAFT") {
      await t.rollback();
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }

    if (
      data.Pegawai.some(
        (pegawai) =>
          pegawai.process_keluarga !== "DONE" ||
          pegawai.process_biaya !== "DONE" ||
          pegawai.process_termin !== "DONE"
      )
    ) {
      await t.rollback();
      return errorResponse(
        res,
        "Proses keluarga, biaya, dan termin belum selesai",
        null,
        400
      );
    }

    if (
      data.Pegawai.some((pegawai) => pegawai.MonitoringTagihan.sisa_tagihan > 0)
    ) {
      await t.rollback();
      return errorResponse(
        res,
        "masih ada sisa tagihan yang belum dibuat rencana pembayaran",
        null,
        400
      );
    }

    if (
      !data.Timeline.find((timeline) => timeline.ref_kode === "01") ||
      !data.Timeline.find((timeline) => timeline.ref_kode === "02") ||
      !data.Timeline.find((timeline) => timeline.ref_kode === "03")
    ) {
      await t.rollback();
      return errorResponse(
        res,
        "Surat Keputusan belum memiliki timeline lengkap",
        null,
        400
      );
    }

    data.status = "PUBLISH";
    await data.save({ transaction: t });

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
    await t.commit();
    return successResponse(res, "Surat Keputusan berhasil di publish", {
      id: SkId,
    });
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};

export const setTimeline = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { SkId } = req.params;
    const { timeline_sanggah, timeline_verifikasi, timeline_spm } = req.body;
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];

    if (!timeline_sanggah)
      ValidationError.push({
        field: "timeline_sanggah",
        message: "Timeline Sangah tidak boleh kosong",
      });
    if (!timeline_verifikasi)
      ValidationError.push({
        field: "timeline_verifikasi",
        message: "Timeline Verifikasi tidak boleh kosong",
      });
    if (new Date(timeline_verifikasi) < new Date(timeline_sanggah)) {
      ValidationError.push({
        field: "timeline_verifikasi",
        message: "Timeline Verifikasi tidak boleh sebelum Timeline Sangah",
      });
    }

    if (!timeline_spm)
      ValidationError.push({
        field: "timeline_spm",
        message: "Timeline SPM tidak boleh kosong",
      });

    if (new Date(timeline_spm) < new Date(timeline_verifikasi)) {
      ValidationError.push({
        field: "timeline_spm",
        message: "Timeline SPM tidak boleh sebelum Timeline Verifikasi",
      });
    }

    if (ValidationError.length > 0) {
      await t.rollback();
      return errorResponse(res, "Validation gagal", ValidationError, 422);
    }

    await Timeline.upsert(
      {
        sk_id: SkId,
        ref_kode: "01",
        tanggal: timeline_sanggah,
      },
      {
        transaction: t,
      }
    );
    await Timeline.upsert(
      {
        sk_id: SkId,
        ref_kode: "02",
        tanggal: timeline_verifikasi,
      },
      {
        transaction: t,
      }
    );
    await Timeline.upsert(
      {
        sk_id: SkId,
        ref_kode: "03",
        tanggal: timeline_spm,
      },
      {
        transaction: t,
      }
    );

    await t.commit();
    return successResponse(res, "Timeline berhasil diupdate");
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};

export const getOverview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "Golongan",
            },
            {
              association: "Keluarga",
              include: [
                {
                  association: "Ref",
                },
              ],
            },
            {
              association: "RincianBiaya",
            },
            {
              association: "Termin",
              include: [
                {
                  association: "Ref",
                },
              ],
            },
            {
              association: "KantorAsal",
              include: [
                {
                  association: "Kota",
                },
              ],
            },
            {
              association: "KantorTujuan",
              include: [
                {
                  association: "Kota",
                },
              ],
            },
            {
              association: "MonitoringTagihan",
            },
          ],
        },
      ],
    });

    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    const { Pegawai } = data;
    const totalBiaya = Pegawai.reduce((acc, pegawai) => {
      return acc + pegawai.MonitoringTagihan.total_tagihan;
    }, 0);
    const biayaTertinggi = Pegawai.reduce((max, pegawai) => {
      return pegawai.MonitoringTagihan.total_tagihan > max
        ? pegawai.MonitoringTagihan.total_tagihan
        : max;
    }, 0);
    const biayaTerendah = Pegawai.reduce((min, pegawai) => {
      return pegawai.MonitoringTagihan.total_tagihan < min
        ? pegawai.MonitoringTagihan.total_tagihan
        : min;
    }, Number.MAX_VALUE);
    const rataRataBiaya = Pegawai.length > 0 ? totalBiaya / Pegawai.length : 0;

    const nilaiTermin: {
      nama: string;
      nominal: number;
    }[] = Pegawai.flatMap((pegawai) =>
      pegawai.Termin.map((termin) => ({
        nama: termin.Ref.nama,
        nominal: termin.nominal,
      }))
    );

    const aggregatedNilaiTermin: { [key: string]: number } = {};
    nilaiTermin.forEach((item) => {
      if (aggregatedNilaiTermin[item.nama]) {
        aggregatedNilaiTermin[item.nama] += item.nominal;
      } else {
        aggregatedNilaiTermin[item.nama] = item.nominal;
      }
    });

    const finalNilaiTermin = Object.keys(aggregatedNilaiTermin).map((nama) => ({
      nama,
      nominal: aggregatedNilaiTermin[nama],
    }));

    const summary = {
      total_pegawai: Pegawai.length,
      total_biaya: totalBiaya,
      biaya_tertinggi: biayaTertinggi,
      biaya_terendah: biayaTerendah === Number.MAX_VALUE ? 0 : biayaTerendah,
      rata_rata_biaya: rataRataBiaya,
      nilai_termin: finalNilaiTermin,
    };

    const pdf = await PdfService.OverviewSK({ data, summary });
    const pdfBuffer = Buffer.from(pdf, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${data.nomor.replace(/\//g, "_")}.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (error: unknown) {
    next(error);
  }
};

export const batalSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
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
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (data.status !== "PUBLISH") {
      t.rollback();
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status PUBLISH",
        null,
        400
      );
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
    await DokumenTermin.destroy({
      where: {
        termin_id: termin.map((t) => t.id),
      },
      transaction: t,
    });
    await AlikaService.sendBulkPushNotification({
      nip: data.Pegawai.map((p) => p.nip),
      title: "Surat Keputusan Mutasi",
      message:
        "Surat Keputusan Mutasi telah dibatalkan oleh Bagian SDM, karena ada kesalahan teknis",
    });
    await t.commit();
    return successResponse(res, "Surat Keputusan berhasil dibatalkan", {
      id: SkId,
    });
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};

export const selesaiSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findByPk(SkId, {
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
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (data.status !== "PUBLISH") {
      t.rollback();
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status PUBLISH",
        null,
        400
      );
    }

    const termin = data.Pegawai.flatMap((pegawai) => pegawai.Termin);

    const allTerminPaid = termin.every((t) => t.status === "PAID");

    if (!allTerminPaid) {
      t.rollback();
      return errorResponse(
        res,
        "Masih terdapat termin yang belum dibayar",
        null,
        400
      );
    }
    data.status = "SELESAI";
    await data.save({ transaction: t });
    await t.commit();
    return successResponse(res, "Surat Keputusan berhasil diselesaikan", {
      id: SkId,
    });
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};
