import { RefBarang } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllBarang = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sortField = (req.query.sortField as string) || "golongan";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const { rows: data, count } = await RefBarang.findAndCountAll({
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil data referensi barang", data,{
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error)
  }
};

export const getBarangById = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefBarang.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data referensi barang", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const createBarang = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { golongan, status, volume } = req.body;
    const data = await RefBarang.create({
      golongan,
      status,
      volume,
    });

    return successResponse(res, "Berhasil menambahkan data referensi barang", data);
  } catch (error: unknown) {    
    next(error)
  }
};

export const updateBarang = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  const { id } = req.params;
  try {
    const { golongan, status, volume } = req.body;
    const data = await RefBarang.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (golongan) data.golongan = golongan;
    if (status) data.status = status;
    if (volume) data.volume = volume;
    await data.save();
    return successResponse(res, "Berhasil mengubah data referensi barang");
  } catch (error: unknown) {
    next(error)
  }
};

export const deleteBarang = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  const { id } = req.params;
  try {
    const data = await RefBarang.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data referensi barang");
  } catch (error: unknown) {
    next(error)
  }
};
