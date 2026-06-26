import { parse } from "csv-parse";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import { PdfService } from "@/services/pdf.service";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import sequelize from "@/config/db.config";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Rekening, SuratKeputusan } from "@/repositories";

export const SuratKeputusanController = {
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
      limit,
      offset,
      order,
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "MonitoringTagihan",
            },
          ],
        },
      ],
    });
    successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data.map((d) => {
        if (d.status === "DRAFT") {
          return {
            id: d.id,
            nomor: "DRAFT",
            uraian: "DRAFT",
            tanggal: d.tanggal,
            tmt: d.tanggal,
            jenjang: "DRAFT",
            status: "DRAFT",
            total_tagihan: d.Pegawai.reduce(
              (total, p) => total + p.MonitoringTagihan.total_tagihan,
              0
            ),
          };
        } else {
          return {
            id: d.id,
            nomor: d.nomor,
            uraian: d.uraian,
            tanggal: d.tanggal,
            tmt: d.tmt,
            jenjang: d.jenjang,
            status: d.status,
            total_tagihan: d.Pegawai.reduce(
              (total, p) => total + p.MonitoringTagihan.total_tagihan,
              0
            ),
          };
        }
      }),
      pagination
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
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
      throw new NotFoundError("data tidak ditemukan");
    }
    successResponse(res, "Berhasil mengambil data surat keputusan", data);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;

    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.nomor.replace(/\//g, "_")}.pdf`, "application/pdf");
  }),

  getPegawais: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;

    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
      include: [
        {
          association: "Pegawai",
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    successResponse(res, "Berhasil mengambil data pegawai", data);
  }),

  importPayroll: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const file = req.file;
      if (!file) {
        throw new InvalidRequestError("File tidak ditemukan");
      }
      const { SkId } = req.params;
      if (typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const csvBuffer = file.buffer;
      const records: {
        pegawai_id: string;
        nomor_rekening: string;
        nama_rekening: string;
        nama_bank: string;
      }[] = [];
      const parser = parse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ";",
      });
      const data = await SuratKeputusan.findOne({
        where: {
          id: SkId,
          status: {
            [Op.ne]: "DRAFT",
          },
        },
        include: [
          {
            association: "Pegawai",
            include: [
              {
                association: "Rekening",
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      const pegawaiNips = data.Pegawai.map((p) => p.nip);
      const parserNips: string[] = [];
      for await (const record of parser) {
        if (data.Pegawai.find((p) => p.nip === record.nip)) {
          parserNips.push(record.nip);
          records.push({
            pegawai_id: data.Pegawai.find((p) => p.nip === record.nip)?.id || "",
            nomor_rekening: record.nomor_rekening,
            nama_rekening: record.nama_rekening,
            nama_bank: record.nama_bank.toUpperCase(),
          });
        }
      }

      const allNipIncluded = pegawaiNips.every((nip: string) => parserNips.includes(nip));
      if (!allNipIncluded) {
        throw new InvalidRequestError("Tidak semua pegawai dalam SK ada di file payroll");
      }
      for (const record of records) {
        await Rekening.CreateOrUpdate(
          {
            pegawai_id: record.pegawai_id,
            nomor_rekening: record.nomor_rekening,
            nama_rekening: record.nama_rekening,
            nama_bank: record.nama_bank,
          },
          t
        );
      }

      successResponse(res, "Berhasil mengimpor payroll");
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
        status: {
          [Op.ne]: "DRAFT",
        },
      },
    });

    const pdf = await PdfService.OverviewSK({ data, summary });
    const pdfBuffer = Buffer.from(pdf, "base64");
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
        status: {
          [Op.ne]: "DRAFT",
        },
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
      headers.join(";"),
      ...csvData.map((row) =>
        headers
          .map((header) => JSON.stringify((row as Record<string, any>)[header] || ""))
          .join(";")
      ),
    ].join("\n");

    const csvBuffer = Buffer.from(csvContent, "utf-8");
    fileResponse(res, csvBuffer, `${data.nomor.replace(/\//g, "_")}.csv`, "text/csv");
  }),
};
