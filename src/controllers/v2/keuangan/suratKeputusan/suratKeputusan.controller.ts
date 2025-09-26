import { SuratKeputusan, Rekening } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { MinioService } from "@/services/minio.service";
import sequelize from "@/config/db.config";
import { parse } from "csv-parse";
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
    const data = await SuratKeputusan.findAll({
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
    const count = await SuratKeputusan.count({
      where,
    });
    return successResponse(
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

export const getSuratKeputusanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
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

export const getSuratKeputusanFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
    });
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
    } else {
      return errorResponse(res, "File tidak ditemukan", null, 404);
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
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data, 200);
  } catch (error: unknown) {
    next(error);
  }
};

export const importPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];

    const {
      file,
      params: { SkId },
    } = req;

    if (!file) {
      ValidationError.push({
        field: "file",
        message: "file wajib diisi",
      });
    }

    if (ValidationError.length > 0) {
      await t.rollback();
      return errorResponse(
        res,
        "Parameter tidak lengkap",
        ValidationError,
        422
      );
    }

    if (!file) {
      await t.rollback();
      return errorResponse(res, "file wajib diisi", null, 400);
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
    const sk = await SuratKeputusan.findByPk(SkId, {
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
    if (!sk || sk.status === "DRAFT") {
      await t.rollback();
      return errorResponse(res, "data tidak dapat di proses", null, 409);
    }
    const pegawaiNips = sk.Pegawai.map((p) => p.nip);
    const parserNips: string[] = [];
    for await (const record of parser) {
      if (sk.Pegawai.find((p) => p.nip === record.nip)) {
        parserNips.push(record.nip);
        records.push({
          pegawai_id: sk.Pegawai.find((p) => p.nip === record.nip)?.id || "",
          nomor_rekening: record.nomor_rekening,
          nama_rekening: record.nama_rekening,
          nama_bank: record.nama_bank.toUpperCase(),
        });
      }
    }

    const allNipIncluded = pegawaiNips.every((nip: string) =>
      parserNips.includes(nip)
    );
    if (!allNipIncluded) {
      await t.rollback();
      return errorResponse(
        res,
        "Parameter tidak lengkap",
        [
          {
            field: "file",
            message: "Tidak semua pegawai dalam SK ada di file payroll",
          },
        ],
        422
      );
    }
    for (const record of records) {
      await Rekening.upsert(
        {
          pegawai_id: record.pegawai_id,
          nomor_rekening: record.nomor_rekening,
          nama_rekening: record.nama_rekening,
          nama_bank: record.nama_bank,
        },
        { transaction: t }
      );
    }
    await t.commit();
    return successResponse(res, "Berhasil mengimpor payroll", null);
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
    const data = await SuratKeputusan.findOne({
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
          ],
        },
      ],
      where: {
        id: SkId,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
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
