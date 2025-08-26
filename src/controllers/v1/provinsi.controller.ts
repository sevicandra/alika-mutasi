import { RefProvinsi } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllProvinsi = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.provinsi = { [Op.like]: `%${search}%` };
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const provinsi = await RefProvinsi.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefProvinsi.count({ where });
    return successResponse(res, "Berhasil mengambil data provinsi", provinsi, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error)
  }
};

export const getProvinsiById = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id } = req.params;
    const provinsi = await RefProvinsi.findByPk(id);
    if (!provinsi) {
      return errorResponse(res, "Provinsi tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data provinsi", provinsi);
  } catch (error: unknown) {
    next(error)
  }
};

export const getProvinsiByKode = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { kode } = req.params;
    const provinsi = await RefProvinsi.findOne({
      where: {
        kode,
      },
    });

    if (!provinsi) {
      return errorResponse(res, "Provinsi tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data provinsi", provinsi);
  } catch (error: unknown) {
    next(error)
  }
};

export const createProvinsi = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { kode, provinsi } = req.body;
    if (!kode || !provinsi) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const data = await RefProvinsi.create({
      kode,
      provinsi,
    });

    return successResponse(res, "Berhasil membuat data provinsi", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const updateProvinsi = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id } = req.params;
    const { kode, provinsi } = req.body;
    if (!id) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const data = await RefProvinsi.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (kode) data.kode = kode;
    if (provinsi) data.provinsi = provinsi;
    await data.save();
    return successResponse(res, "Berhasil mengubah data provinsi", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const deleteProvinsi = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefProvinsi.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data provinsi", {
      id,
    });
  } catch (error: unknown) {
    next(error)
  }
};
