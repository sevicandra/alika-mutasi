import { RefPejabat } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllPejabat = async (
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
    const { rows: data, count } = await RefPejabat.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil referensi pejabat", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getPejabatById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefPejabat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil referensi pejabat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createPejabat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jenis, nama, nip } = req.body;
    const data = await RefPejabat.create({
      jenis,
      nama,
      nip,
    });

    return successResponse(res, "Berhasil menambahkan referensi pejabat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updatePejabat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { jenis, nama, nip } = req.body;
    const data = await RefPejabat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (jenis) data.jenis = jenis;
    if (nama) data.nama = nama;
    if (nip) data.nip = nip;
    await data.save();
    return successResponse(res, "Berhasil mengubah referensi pejabat");
  } catch (error: unknown) {
    next(error);
  }
};

export const deletePejabat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefPejabat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus referensi pejabat");
  } catch (error: unknown) {
    next(error);
  }
};
