import { Art } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllArt = async (
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
    const data = await Art.findAll({
      limit,
      offset,
      order,
    });
    const count = await Art.count();
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

export const getArtById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await Art.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createArt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pegawai_id, nik, nama } = req.body;
    if (!pegawai_id || !nik || !nama) {
      return errorResponse(res, "Data tidak lengkap", null, 400);
    }

    const data = await Art.create({
      pegawai_id,
      nik,
      nama,
    });

    return successResponse(res, "Berhasil membuat data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateArt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { nik, nama } = req.body;
    const data = await Art.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (nik) data.nik = nik;
    if (nama) data.nama = nama;
    await data.save();
    return successResponse(res, "Berhasil memperbarui data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteArt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await Art.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data darat", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};
