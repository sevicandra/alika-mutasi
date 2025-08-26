import { RefUangHarian } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const where: any = {};
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const provinsi = await RefUangHarian.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefUangHarian.count({ where });
    return successResponse(res, "Berhasil mengambil data provinsi", provinsi, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getUangHarianById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const provinsi = await RefUangHarian.findByPk(id);
    if (!provinsi) {
      return errorResponse(res, "Provinsi tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data provinsi", provinsi);
  } catch (error: unknown) {
    next(error);
  }
};

export const createUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { kode_provinsi, tarif } = req.body;
    if (!kode_provinsi || !tarif) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const data = await RefUangHarian.create({
      kode_provinsi,
      tarif,
    });

    return successResponse(res, "Berhasil membuat data provinsi", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { kode_provinsi, tarif } = req.body;
    if (!id) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const data = await RefUangHarian.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (kode_provinsi) data.kode_provinsi = kode_provinsi;
    if (tarif) data.tarif = tarif;
    await data.save();
    return successResponse(res, "Berhasil mengubah data provinsi", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefUangHarian.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data provinsi", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};
