import { Rekening, Termin } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
  Op,
  col,
  where,
} from "sequelize";
import { AxiosError } from "axios";
import sequelize from "@/config/db.config";
import { Logger } from "@/services/log.service";
import { AlikaService } from "@/services/alika.service";

export const getAllTermin = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const tahap = (req.query.tahap as string) || undefined;
    const status = (req.query.status as string) || undefined;

    const { SkId } = req.params;
    const whereClause: any = {
      status: {
        [Op.or]: ["APPROVED_KEU", "PAID"],
      },
    };
    if (search) {
      whereClause[Op.or] = [
        where(col("Pegawai.nama"), { [Op.like]: `%${search}%` }),
        where(col("Pegawai.nip"), { [Op.like]: `%${search}%` }),
      ];
    }
    if (tahap) {
      whereClause[Op.and] = [where(col("Payroll.tahap"), tahap)];
    }
    if (status) {
      whereClause.status = status;
    }

    const { rows: data, count } = await Termin.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      attributes: [
        "id",
        "tahun",
        "nominal",
        "status",
        [sequelize.col("Ref.nama"), "nama"],
        [sequelize.col("Ref.urutan"), "urutan"],
      ],
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            sk_id: SkId,
          },
          include: [
            {
              association: "Rekening",
            },
          ],
        },
        {
          association: "Ref",
        },
        {
          association: "Payroll",
        },
      ],
    });

    return successResponse(
      res,
      "Berhasil mendapatkan termin",
      data.map((d) => {
        return {
          id: d.id,
          tahun: d.tahun,
          nominal: d.nominal,
          status: d.status,
          nama: d.Ref.nama,
          urutan: d.Ref.urutan,
          pegawai: {
            nama: d.Pegawai.nama,
            nip: d.Pegawai.nip,
          },
          rekening: {
            nama: d.Pegawai.Rekening?.nama_rekening,
            bank: d.Pegawai.Rekening?.nama_bank,
            nomor: d.Pegawai.Rekening?.nomor_rekening,
          },
          payroll: {
            tanggal: d.Payroll?.tanggal || null,
            tahap: d.Payroll?.tahap || "-",
          },
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
    console.log(error);

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

export const payrollTermin = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { tanggal, tahap } = req.body;

    if (!tanggal || !tahap) {
      return errorResponse(res, "Tanggal dan tahap harus diisi", null, 400);
    }

    const termin = await Termin.findByPk(id);
    if (!termin) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
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

export const tolakTermin = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { nip } = req.user;
    const { SkId, TerminId } = req.params;
    const {
      catatan,
    }: {
      catatan: string;
    } = req.body;
    if (!catatan) {
      return errorResponse(
        res,
        "Validation error",
        [
          {
            field: "catatan",
            message: "Catatan tidak boleh kosong",
          },
        ],
        422
      );
    }
    const data = await Termin.findOne({
      where: {
        id: TerminId,
      },
      include: [
        { association: "Pegawai", where: { sk_id: SkId } },
        { association: "Payroll" },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    if (data.status !== "APPROVED_KEU" && data.status !== "PAID") {
      return errorResponse(res, "Termin tidak dalam status draft", null, 400);
    }
    data.status = "WAITING_APPROVAL_KEU";
    await data.Payroll?.destroy({ transaction: t });
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: data.Pegawai.id,
      actor_nip: nip,
      actor_role: "Keuangan",
      action: "Tolak Payroll",
      description: `Proses Payroll di tolak oleh Keuangan dengan catatan: ${catatan}`,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      nip: data.Pegawai.nip,
      message: `${catatan}`,
      title: "Payroll Mutasi Ditolak",
    });
    await t.commit();
    return successResponse(res, "Berhasil tolak payroll", null, 200);
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

export const getRekening = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { SkId, TerminId } = req.params;
    const data = await Termin.findOne({
      where: {
        id: TerminId,
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: { sk_id: SkId },
          include: [{ association: "Rekening", attributes:["nama_rekening", "nama_bank", "nomor_rekening"] }],
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil data rekening",
      data.Pegawai.Rekening,
      200
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

export const updateRekening = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const t = await sequelize.transaction();
  try {
    const { SkId, TerminId } = req.params;
    const { nama_rekening, nama_bank, nomor_rekening } = req.body;

    const data = await Termin.findOne({
      where: {
        id: TerminId,
      },
      include: [
        {
          association: "Pegawai",
          where: { sk_id: SkId },
          include: [{ association: "Rekening" }],
        },
      ],
      transaction: t,
    });

    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }

    if (data.status === "PAID") {
      return errorResponse(res, "Payroll telah di prosess", null, 400);
    }

    const rekening = data.Pegawai.Rekening;
    if (!rekening) {
      return errorResponse(res, "Rekening pegawai tidak ditemukan", null, 404);
    }
    await rekening.destroy({ transaction: t });

    await Rekening.create(
      {
        pegawai_id: data.Pegawai.id,
        nama_rekening,
        nama_bank,
        nomor_rekening,
      },
      { transaction: t }
    );
    await t.commit();
    return successResponse(res, "Berhasil memperbarui rekening", null, 200);
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
