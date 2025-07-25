import { Termin, sequelize, DokumenTermin } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
  Op,
  where,
  col,
} from "sequelize";
import { AxiosError } from "axios";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
import { MinioService } from "@/services/minio.service";

const minioService = new MinioService();

export const getAllPermohonan = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";

    const whereClause = search
      ? {
          [Op.or]: [
            where(col("Pegawai.nama"), { [Op.like]: `%${search}%` }),
            where(col("Pegawai.nip"), { [Op.like]: `%${search}%` }),
          ],
          status: "WAITING_APPROVAL_KEU",
        }
      : { status: "WAITING_APPROVAL_KEU" };

    const { rows: data, count } = await Termin.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["nomor", "jenjang"],
            },
            {
              association: "KantorAsal",
            },
            {
              association: "KantorTujuan",
            },
          ],
        },
        {
          association: "Ref",
        },
      ],
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil data pegawai", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
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

export const getPermohonanById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { PermohonanId } = req.params;
  try {
    const data = await Termin.findByPk(PermohonanId, {
      include: [
        {
          association: "DokumenTermin",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data pegawai", data);
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

export const setujuiPermohonan = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip } = req.user;
  const { PermohonanId } = req.params;
  const { catatan } = await req.body;
  const t = await sequelize.transaction();
  try {
    const data = await Termin.findOne({
      where: {
        id: PermohonanId,
        status: "WAITING_APPROVAL_KEU",
      },
      include: [
        {
          association: "Pegawai",
        },
      ],
      transaction: t,
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    data.status = "APPROVED_KEU";
    await data.save({ transaction: t });
    await AlikaService.sendPushNotification({
      nip: data.Pegawai.nip,
      message:
        "Permohonan pembayaran telah disetujui oleh Bagian Keuangan dan akan segera diproses payroll",
    });
    await Logger.GeneralAction({
      pegawai_id: data.Pegawai.id,
      actor_nip: nip,
      actor_role: "KEU",
      action: "Setujui permohonan pembayaran",
      description: catatan ? catatan : null,
      transaction: t,
    });
    await t.commit();
    return successResponse(res, "Berhasil mengubah status permohonan", data);
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

export const tolakPermohonan = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { PermohonanId } = req.params;
  const { nip } = req.user;
  const { catatan } = await req.body;
  const t = await sequelize.transaction();
  try {
    if (!catatan) {
      await t.rollback();
      return errorResponse(
        res,
        "Validation gagal",
        [
          {
            field: "catatan",
            message: "Catatan harus diisi",
          },
        ],
        422
      );
    }
    const data = await Termin.findOne({
      where: {
        id: PermohonanId,
        status: "WAITING_APPROVAL_KEU",
      },
      include: [
        {
          association: "Pegawai",
        },
      ],
      transaction: t,
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    data.status = "REJECTED";
    await AlikaService.sendPushNotification({
      nip: data.Pegawai.nip,
      message:
        "Permohonan pembayaran telah di tolak oleh Bagian Keuangan. silahkan cek pada menu history untuk melihat detail penolakan",
    });
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: data.Pegawai.id,
      actor_nip: nip,
      actor_role: "KEU",
      action: "Tolak permohonan pembayaran",
      description: catatan,
      transaction: t,
    });
    await t.commit();
    return successResponse(res, "Berhasil mengubah status permohonan", data);
  } catch (error: unknown) {
    t.rollback();
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

export const getDokumenFile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PermohonanId, DokumenId } = req.params;
    const data = await DokumenTermin.findOne({
      where: {
        termin_id: PermohonanId,
        id: DokumenId,
      },
    });
    if (!data || !data.file) {
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
          `inline; filename="${data.document_type}.pdf"`
        );
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    } else {
      throw new Error("File tidak ditemukan");
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
