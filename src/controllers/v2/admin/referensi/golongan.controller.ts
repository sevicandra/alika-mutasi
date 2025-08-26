import { RefGolongan } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "kode";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("kode"), { [Op.like]: `%${search}%` }),
            where(col("nama"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { rows: data, count } = await RefGolongan.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil data golongan", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getGolonganById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefGolongan.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data golongan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { kode, nama } = req.body;
    const data = await RefGolongan.create({
      kode,
      nama,
    });

    return successResponse(res, "Berhasil menambahkan data golongan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { kode, nama } = req.body;
    const data = await RefGolongan.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kode) data.kode = kode;
    if (nama) data.nama = nama;
    await data.save();
    return successResponse(res, "Berhasil mengubah data golongan");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefGolongan.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data golongan");
  } catch (error: unknown) {
    next(error);
  }
};
