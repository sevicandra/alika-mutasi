import { PembayaranLog } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
  Op,
} from "sequelize";
import { AxiosError } from "axios";

export const getAllHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { SkId, PegawaiId } = req.params;
  try {
    const data = await PembayaranLog.findAll({
      where: {
        pegawai_id: PegawaiId,
      },
      include: [
        {
          association: "Pegawai",
          where: {
            sk_id: SkId,
          },
          include: [
            {
              association: "SuratKeputusan",
              where: {
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],
      attributes: {
        exclude: ["payload", "Pegawai"],
      },
      order: [["created_at", "ASC"]],
    });

    return successResponse(res, "data berhasil didapatkan", data);
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

export const getHistoryById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { SkId, PegawaiId, HistoryId } = req.params;
  try {
    const data = await PembayaranLog.findOne({
      where: {
        id: HistoryId,
        pegawai_id: PegawaiId,
      },
      include: [
        {
          association: "Pegawai",
          where: {
            sk_id: SkId,
          },
          attributes: [],
          include: [
            {
              association: "SuratKeputusan",
              where: {
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
              attributes: [],
            },
          ],
        },
      ],
      attributes: {
        include: ["payload", "action_type"],
      },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data);
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
