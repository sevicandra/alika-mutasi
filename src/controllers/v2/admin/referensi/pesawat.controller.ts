import { RefPesawat } from "@/models";
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

export const getAllPesawat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "kota_asal";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("rute"), { [Op.like]: `%${search}%` }),
            where(col("KotaAsal.kota"), { [Op.like]: `%${search}%` }),
            where(col("KotaTujuan.kota"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { rows: data, count } = await RefPesawat.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
      include: [
        {
          association: "KotaAsal",
          attributes: ["id", "kota", "kode"],
          include: [
            {
              association: "Provinsi",
              attributes: ["id", "provinsi", "kode"],
            },
          ],
        },
        {
          association: "KotaTujuan",
          attributes: ["id", "kota", "kode"],
          include: [
            {
              association: "Provinsi",
              attributes: ["id", "provinsi", "kode"],
            },
          ],
        },
      ],
    });
    return successResponse(
      res,
      "Berhasil mengambil data pesawat",
      data.map((item) => ({
        id: item.id,
        kota_asal: item.KotaAsal.kota,
        provinsi_asal: item.KotaAsal.Provinsi.provinsi,
        kota_tujuan: item.KotaTujuan.kota,
        provinsi_tujuan: item.KotaTujuan.Provinsi.provinsi,
        rute: item.rute,
        ekonomi: item.ekonomi,
        bisnis: item.bisnis,
        jenis_tarif: item.jenis_tarif,
      })),
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

export const getPesawatById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;
  try {
    const data = await RefPesawat.findByPk(id, {
      include: [
        {
          association: "KotaAsal",
          attributes: ["kode_provinsi"],
        },
        {
          association: "KotaTujuan",
          attributes: ["kode_provinsi"],
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data pesawat", {
      id: data.id,
      kota_asal: data.kota_asal,
      provinsi_asal: data.KotaAsal.kode_provinsi,
      kota_tujuan: data.kota_tujuan,
      provinsi_tujuan: data.KotaTujuan.kode_provinsi,
      rute: data.rute,
      ekonomi: data.ekonomi,
      bisnis: data.bisnis,
      jenis_tarif: data.jenis_tarif,
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

export const createPesawat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { kota_asal, kota_tujuan, ekonomi, bisnis, rute, jenis_tarif } =
      req.body;
    const data = await RefPesawat.create({
      kota_asal,
      kota_tujuan,
      ekonomi,
      bisnis,
      rute,
      jenis_tarif,
    });

    return successResponse(res, "Berhasil menambahkan data pesawat", data);
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

export const updatePesawat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;
  try {
    const { kota_asal, kota_tujuan, ekonomi, bisnis, rute, jenis_tarif } =
      req.body;
    const data = await RefPesawat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kota_asal) data.kota_asal = kota_asal;
    if (kota_tujuan) data.kota_tujuan = kota_tujuan;
    if (ekonomi) data.ekonomi = ekonomi;
    if (bisnis) data.bisnis = bisnis;
    if (rute) data.rute = rute;
    if (jenis_tarif) data.jenis_tarif = jenis_tarif;
    await data.save();
    return successResponse(res, "Berhasil mengubah data pesawat");
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

export const deletePesawat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;
  try {
    const data = await RefPesawat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data pesawat");
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
