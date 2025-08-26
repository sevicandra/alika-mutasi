import { RefGolongan } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);

    const data = await RefGolongan.findAll({
      limit,
      offset,
      order,
    });
    const count = await RefGolongan.count();
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

export const getGolonganById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefGolongan.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data darat", data);
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
    if (!kode || !nama) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const data = await RefGolongan.create({
      kode,
      nama,
    });
    return successResponse(res, "Berhasil membuat data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { kode, nama } = req.body;
    const data = await RefGolongan.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (kode) data.kode = kode;
    if (nama) data.nama = nama;
    await data.save();
    return successResponse(res, "Berhasil mengubah data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteGolongan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefGolongan.findByPk(id);
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
