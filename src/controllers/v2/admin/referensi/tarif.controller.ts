import { RefTarif } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllTarif = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "jenis";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [where(col("jenis"), { [Op.like]: `%${search}%` })],
        }
      : {};
    const { rows: data, count } = await RefTarif.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil referensi Tarif", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getTarifById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefTarif.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil referensi Tarif", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createTarif = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tarif, jenis } = req.body;

    const data = await RefTarif.create({
      tarif,
      jenis,
    });

    return successResponse(res, "Berhasil menambahkan referensi Tarif", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateTarif = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { tarif, jenis } = req.body;
    const data = await RefTarif.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (jenis) data.jenis = jenis;
    if (tarif) data.tarif = tarif;
    await data.save();
    return successResponse(res, "Berhasil mengubah referensi Tarif");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteTarif = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefTarif.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus referensi Tarif");
  } catch (error: unknown) {
    next(error);
  }
};
