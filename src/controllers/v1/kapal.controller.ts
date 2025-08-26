import { RefKapal } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllKapal = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const kota_asal = req.query.kota_asal || undefined;
    const kota_tujuan = req.query.kota_tujuan || undefined;
    const kapal = req.query.kapal || undefined;
    const where: any = {};
    if (search) where.rute = { [Op.like]: `%${search}%` };
    if (kota_asal) where.kota_asal = kota_asal;
    if (kota_tujuan) where.kota_tujuan = kota_tujuan;
    if (kapal) where.kapal = kapal;
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const data = await RefKapal.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefKapal.count({ where });
    return successResponse(res, "Berhasil mengambil data kapal", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error)
  }
};

export const getKapalById = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id } = req.params;
    const kapal = await RefKapal.findByPk(id);
    if (!kapal) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data kapal", kapal);
  } catch (error: unknown) {
    next(error)
  }
};

export const createKapal = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { kapal, rute, kota_asal, kota_tujuan, tarif } = req.body;
    if (!kapal || !kota_asal || !kota_tujuan || !tarif || !rute) {
      return errorResponse(res, "parameter tidak lengkap", null, 400);
    }

    const data = await RefKapal.create({
      kapal,
      kota_asal,
      kota_tujuan,
      tarif,
      rute,
    });

    return successResponse(res, "Berhasil membuat data kapal", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const updateKapal = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { id } = req.params;
    const { kapal, rute, kota_asal, kota_tujuan, tarif } = req.body;
    const data = await RefKapal.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    if (kapal) data.kapal = kapal;
    if (rute) data.rute = rute;
    if (kota_asal) data.kota_asal = kota_asal;
    if (kota_tujuan) data.kota_tujuan = kota_tujuan;
    if (tarif) data.tarif = tarif;

    await data.save();

    return successResponse(res, "Berhasil memperbarui data kapal", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const deleteKapal = async (req: AuthenticatedRequest, res: Response, next:NextFunction) => {
  try {
    const { id } = req.params;
    const data = await RefKapal.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data kapal", data);
  } catch (error: unknown) {
    next(error)
  }
};
