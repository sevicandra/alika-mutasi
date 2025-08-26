import { RefHubunganKeluarga } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllHubunganKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.nama = { [Op.like]: `%${search}%` };
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const hubunganKeluarga = await RefHubunganKeluarga.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await RefHubunganKeluarga.count({ where });
    return successResponse(
      res,
      "Berhasil mengambil data hubungan keluarga",
      hubunganKeluarga,
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getHubunganKeluargaById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const hubunganKeluarga = await RefHubunganKeluarga.findByPk(id);
    if (!hubunganKeluarga) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil data hubungan keluarga",
      hubunganKeluarga
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const createHubunganKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { kode, nama } = req.body;
    if (!kode || !nama) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    const hubunganKeluarga = await RefHubunganKeluarga.create({
      kode: kode,
      nama: nama,
    });
    return successResponse(
      res,
      "Berhasil membuat data hubungan keluarga",
      hubunganKeluarga
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const updateHubunganKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { kode, nama } = req.body;
    const data = await RefHubunganKeluarga.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (kode) data.kode = kode;
    if (nama) data.nama = nama;
    await data.save();
    return successResponse(
      res,
      "Berhasil mengubah data hubungan keluarga",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteHubunganKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await RefHubunganKeluarga.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data hubungan keluarga", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};
