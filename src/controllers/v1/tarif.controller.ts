import { RefTarif } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllTarif = async (
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

    const data = await RefTarif.findAll({
      limit,
      offset,
      order,
    });
    const count = await RefTarif.count();
    return successResponse(res, "Berhasil mengambil data darat", data, {
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
  try {
    const { id } = req.params;
    const data = await RefTarif.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data darat", data);
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
    const { jenis, tarif } = req.body;
    if (!jenis || !tarif) {
      return errorResponse(res, "Data tidak lengkap", null, 400);
    }
    const data = await RefTarif.create({
      jenis,
      tarif,
    });
    return successResponse(res, "Berhasil menambahkan data darat", {
      id: data.id,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const updateTarif = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { jenis, tarif } = req.body;
    const data = await RefTarif.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (jenis) data.jenis = jenis;
    if (tarif) data.tarif = tarif;
    await data.save();
    return successResponse(res, "Berhasil mengubah data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteTarif = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefTarif.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};
