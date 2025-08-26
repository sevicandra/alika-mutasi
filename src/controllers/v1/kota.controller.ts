import { RefKota } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllKota = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.kota = { [Op.like]: `%${search}%` };
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const kota = await RefKota.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefKota.count({ where });
    return successResponse(res, "Berhasil mengambil data kota", kota, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error)
  }
};

export const getKotaById = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { id } = req.params;
    const kota = await RefKota.findByPk(id);
    if (!kota) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data kota", kota);
  } catch (error: unknown) {
    next(error)
  }
};

export const getKotaByKode = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { kode } = req.params;
    const kota = await RefKota.findOne({ where: { kode } });
    if (!kota) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data kota", kota);
  } catch (error: unknown) {
    next(error)
  }
};

export const createKota = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { kode_provinsi, kode, kota } = req.body;
    if (!kode_provinsi || !kode || !kota) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }

    const data = await RefKota.create({
      kode_provinsi,
      kode,
      kota,
    });

    return successResponse(res, "Berhasil membuat data kota", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const updateKota = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { id } = req.params;
    const { kode_provinsi, kode, kota } = req.body;
    if (!id || !kode_provinsi || !kode || !kota) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }

    const data = await RefKota.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (kode_provinsi) data.kode_provinsi = kode_provinsi;
    if (kode) data.kode = kode;
    if (kota) data.kota = kota;
    await data.save();
    return successResponse(res, "Berhasil mengubah data kota", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const deleteKota = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { id } = req.params;
    const kota = await RefKota.findByPk(id);
    if (!kota) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await kota.destroy();
    return successResponse(res, "Berhasil menghapus data kota", {
      id,
    });
  } catch (error: unknown) {
    next(error)
  }
};
