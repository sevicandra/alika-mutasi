import { RefBarang } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllBarang = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const barang = await RefBarang.findAll({
      limit,
      offset,
      order,
    });
    const count = await RefBarang.count();
    return successResponse(res, "Berhasil mengambil data barang", barang, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getBarangById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const barang = await RefBarang.findByPk(id);
    if (!barang) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data barang", barang);
  } catch (error: unknown) {
    next(error);
  }
};

export const createBarang = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { golongan, status, volume } = req.body;
    if (!golongan || !status || !volume) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const data = await RefBarang.create({
      golongan,
      status,
      volume,
    });
    return successResponse(res, "Berhasil membuat data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateBarang = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { golongan, status, volume } = req.body;
    const data = await RefBarang.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (golongan) data.golongan = golongan;
    if (status) data.status = status;
    if (volume) data.volume = volume;
    await data.save();
    return successResponse(res, "Berhasil mengubah data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteBarang = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefBarang.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data darat", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};
