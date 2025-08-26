import { RefPesawat } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllPesawat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const kota_asal = req.query.kota_asal || undefined;
    const kota_tujuan = req.query.kota_tujuan || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.rute = { [Op.like]: `%${search}%` };
    if (kota_asal) where.kota_asal = kota_asal;
    if (kota_tujuan) where.kota_tujuan = kota_tujuan;
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const pesawat = await RefPesawat.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefPesawat.count({
      where,
    });
    return successResponse(res, "Berhasil mengambil data pesawat", pesawat, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getPesawatById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const pesawat = await RefPesawat.findByPk(id);
    if (!pesawat) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data pesawat", pesawat);
  } catch (error: unknown) {
    next(error);
  }
};

export const createPesawat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rute, kota_asal, kota_tujuan, ekonomi, bisnis, jenis_tarif } =
      req.body;
    if (
      !rute ||
      !kota_asal ||
      !kota_tujuan ||
      !ekonomi ||
      !bisnis ||
      !jenis_tarif
    ) {
      return errorResponse(res, "Data tidak lengkap", null, 400);
    }

    const pesawat = await RefPesawat.create({
      rute,
      kota_asal,
      kota_tujuan,
      ekonomi,
      bisnis,
      jenis_tarif,
    });
    return successResponse(res, "Berhasil menambahkan data pesawat", pesawat);
  } catch (error: unknown) {
    next(error);
  }
};

export const updatePesawat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { rute, kota_asal, kota_tujuan, ekonomi, bisnis, jenis_tarif } =
      req.body;
    const data = await RefPesawat.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (rute) data.rute = rute;
    if (kota_asal) data.kota_asal = kota_asal;
    if (kota_tujuan) data.kota_tujuan = kota_tujuan;
    if (ekonomi) data.ekonomi = ekonomi;
    if (bisnis) data.bisnis = bisnis;
    if (jenis_tarif) data.jenis_tarif = jenis_tarif;

    await data.save();

    return successResponse(res, "Berhasil memperbarui data pesawat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deletePegawat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefPesawat.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();

    return successResponse(res, "Berhasil menghapus data pesawat", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};
