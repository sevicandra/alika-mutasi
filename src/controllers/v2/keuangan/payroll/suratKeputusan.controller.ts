import { SuratKeputusan } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
} from "sequelize";
import { Op } from "sequelize";
import { AxiosError } from "axios";
import sequelize from "@/config/db.config";
import exceljs from "exceljs";
import { Payroll, PayrollCounter, Termin } from "@/models";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";

export const getAllSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const jenjang = (req.query.jenjang as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      status: {
        [Op.ne]: "DRAFT",
      },
    };
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
      }),
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
    );
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const getSuratKeputusanById = async (
  req: AuthenticatedRequest,
  res: Response
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
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const downloadPayroll = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const t = await sequelize.transaction();
  try {
    const { nip } = req.user;
    const { SkId } = req.params;
    const {
      terminId,
      tanggal,
    }: {
      terminId: string[];
      tanggal: Date;
    } = req.body;

    if (terminId.length === 0 || !tanggal) {
      return errorResponse(res, "Data tidak lengkap", null, 400);
    }
    const [number] = await PayrollCounter.findOrCreate({
      where: { sk_id: SkId },
      transaction: t,
    });
    const sk = await SuratKeputusan.findOne({
      where: { id: SkId },
      transaction: t,
    });
    if (!sk) {
      return errorResponse(res, "Surat Keputusan tidak ditemukan", null, 404);
    }
    const lastNumber = number.last_number + 1;
    await PayrollCounter.update(
      { last_number: lastNumber },
      { where: { sk_id: SkId }, transaction: t }
    );

    const payrolls = terminId.map((termin) => ({
      termin_id: termin,
      tanggal,
      tahap: "Tahap " + lastNumber,
    }));
    await Payroll.bulkCreate(payrolls, { transaction: t });
    const termin = await Termin.findAll({
      where: {
        id: { [Op.in]: terminId },
        status: "APPROVED_KEU",
      },
      transaction: t,
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          include: [
            {
              association: "Rekening",
              attributes: ["nama_rekening", "nomor_rekening", "nama_bank"],
            },
          ],
        },
      ],
    });

    const terminBNI = termin.filter(
      (t) =>
        t.Pegawai.Rekening?.nama_bank.toUpperCase() === "BNI" ||
        t.Pegawai.Rekening?.nama_bank.toUpperCase() === "BANK NEGARA INDONESIA"
    );
    const terminNonBNI = termin.filter(
      (t) =>
        t.Pegawai.Rekening?.nama_bank.toUpperCase() !== "BNI" &&
        t.Pegawai.Rekening?.nama_bank.toUpperCase() !== "BANK NEGARA INDONESIA"
    );

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Data Payroll");

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Payroll ${sk.nomor}`;
    titleCell.font = { name: "Arial", size: 11, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("A2:H2");
    const subtitleCell = worksheet.getCell("A2");
    subtitleCell.value = `Tanggal: ${new Date(
      tanggal
    ).toLocaleDateString()} - Tahap: ${lastNumber}`;
    subtitleCell.font = { name: "Arial", size: 11, bold: true };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.addRow([]);
    worksheet.addRow(["BNI"]);

    worksheet.addRow([
      "No",
      "Nomor Rekening",
      "Nama Rekening",
      "Bruto",
      "Pajak",
      "Biaya Admin",
      "Netto",
      "Bank",
    ]);
    worksheet.addRows(
      terminBNI.map((t, index) => [
        index + 1,
        t.Pegawai.Rekening?.nomor_rekening || "-",
        t.Pegawai.Rekening?.nama_rekening || "-",
        t.nominal || 0,
        0,
        0,
        t.nominal || 0,
        t.Pegawai.Rekening?.nama_bank || "-",
      ])
    );
    worksheet.addRow([
      "Total",
      "",
      "",
      terminBNI.reduce((total, t) => total + (t.nominal || 0), 0),
      "",
      "",
      terminBNI.reduce((total, t) => total + (t.nominal || 0), 0),
      "",
    ]);

    worksheet.getCell(`A${5}`, `H${worksheet.rowCount}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    worksheet.addRow([]);
    worksheet.addRow(["Non BNI"]);
    worksheet.addRow([
      "No",
      "Nomor Rekening",
      "Nama Rekening",
      "Bruto",
      "Pajak",
      "Biaya Admin",
      "Netto",
      "Bank",
    ]);
    worksheet.addRows(
      terminNonBNI.map((t, index) => [
        index + 1,
        t.Pegawai.Rekening?.nomor_rekening || "-",
        t.Pegawai.Rekening?.nama_rekening || "-",
        t.nominal || 0,
        0,
        2900,
        t.nominal - 2900 || 0,
        t.Pegawai.Rekening?.nama_bank || "-",
      ])
    );
    worksheet.addRow([
      "Total",
      "",
      "",
      terminNonBNI.reduce((total, t) => total + (t.nominal || 0), 0),
      "",
      "",
      terminNonBNI.reduce((total, t) => total + (t.nominal - 2900 || 0), 0),
      "",
    ]);
    worksheet.getCell(
      `A${5 + 4 + terminBNI.length}`,
      `H${worksheet.rowCount}`
    ).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getColumn("A").width = 5;
    worksheet.getColumn("B").width = 20;
    worksheet.getColumn("C").width = 20;
    worksheet.getColumn("D").width = 15;
    worksheet.getColumn("E").width = 15;
    worksheet.getColumn("F").width = 15;
    worksheet.getColumn("G").width = 15;
    worksheet.getColumn("H").width = 20;

    worksheet.getColumn("D").numFmt = '"Rp "#,##0.00';
    worksheet.getColumn("E").numFmt = '"Rp "#,##0.00';
    worksheet.getColumn("F").numFmt = '"Rp "#,##0.00';
    worksheet.getColumn("G").numFmt = '"Rp "#,##0.00';

    const namaFile = `Payroll_${sk.nomor}_${tanggal}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);
    await workbook.xlsx.write(res);
    res.end();

    for (const p of termin) {
      p.status = "PAID";
      await Logger.GeneralAction({
        pegawai_id: p.Pegawai.id,
        actor_nip: nip,
        actor_role: "KEU",
        action: "Proses Payroll",
        description: `Permohonan pembayaran untuk ${
          p.Pegawai.nama
        } telah disetujui dan akan diproses payroll pada tanggal ${new Date(
          tanggal
        ).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        })}`,
        transaction: t,
      });
      await p.save({ transaction: t });
    }

    await AlikaService.sendBulkPushNotification({
      nip: termin.map((t) => t.Pegawai.nip),
      message: `Permohonan pembayaran mutasi anda akan diproses payroll pada tanggal ${new Date(
        tanggal
      ).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })}`,
    });

    await t.commit();
    return successResponse(res, "Berhasil mengunduh data payroll", null, 200);
  } catch (error: unknown) {
    await t.rollback();
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};
