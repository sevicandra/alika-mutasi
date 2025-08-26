import { RefHubunganKeluarga } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllHubunganKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "kode";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("kode"), { [Op.like]: `%${search}%` }),
            where(col("nama"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { rows: data, count } = await RefHubunganKeluarga.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(
      res,
      "Berhasil mengambil referensi Hubungan Keluarga",
      data,
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
  const { id } = req.params;
  try {
    const data = await RefHubunganKeluarga.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil referensi Hubungan Keluarga",
      data
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
    const { kode, nama, jenis } = req.body;

    const data = await RefHubunganKeluarga.create({
      kode,
      nama,
      jenis,
    });

    return successResponse(
      res,
      "Berhasil menambahkan referensi Hubungan Keluarga",
      data
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
  const { id } = req.params;
  try {
    const { kode, nama, jenis } = req.body;
    const data = await RefHubunganKeluarga.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kode) data.kode = kode;
    if (nama) data.nama = nama;
    if (jenis) data.jenis = jenis;
    await data.save();
    return successResponse(
      res,
      "Berhasil mengubah referensi Hubungan Keluarga"
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
  const { id } = req.params;
  try {
    const data = await RefHubunganKeluarga.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(
      res,
      "Berhasil menghapus referensi Hubungan Keluarga"
    );
  } catch (error: unknown) {
    next(error);
  }
};
