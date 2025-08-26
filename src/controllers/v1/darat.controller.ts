import { RefDarat } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const kota_asal = req.query.kota_asal || undefined;
    const kota_tujuan = req.query.kota_tujuan || undefined;
    const where: any = {};
    if (search) where.kantor = { [Op.like]: `%${search}%` };
    if (kota_asal) where.kota_asal = kota_asal;
    if (kota_tujuan) where.kota_tujuan = kota_tujuan;
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const darat = await RefDarat.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefDarat.count({ where });
    return successResponse(res, "Berhasil mengambil data darat", darat, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getDaratById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const darat = await RefDarat.findByPk(id);
    if (!darat) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data darat", darat);
  } catch (error: unknown) {
    next(error);
  }
};

export const createDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rute, kota_asal, kota_tujuan, jarak, pulau } = req.body;
    if (!rute || !kota_asal || !kota_tujuan || !jarak || !pulau) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }
    const darat = await RefDarat.create({
      rute,
      kota_asal,
      kota_tujuan,
      jarak,
      pulau,
    });
    return successResponse(res, "Berhasil menambahkan data darat", darat);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rute, kota_asal, kota_tujuan, jarak, pulau } = req.body;
    const data = await RefDarat.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (rute) data.rute = rute;
    if (kota_asal) data.kota_asal = kota_asal;
    if (kota_tujuan) data.kota_tujuan = kota_tujuan;
    if (jarak) data.jarak = jarak;
    if (pulau) data.pulau = pulau;

    await data.save();

    return successResponse(res, "Berhasil memperbarui data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefDarat.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();

    return successResponse(res, "Berhasil menghapus data darat", { id });
  } catch (error: unknown) {
    next(error);
  }
};
