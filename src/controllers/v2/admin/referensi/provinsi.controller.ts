import { RefProvinsi, RefKota } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllProvinsi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("provinsi"), { [Op.like]: `%${search}%` }),
            where(col("kode"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};

    const { rows: data, count } = await RefProvinsi.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil data pegawai", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getProvinsiById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv } = req.params;
  try {
    const data = await RefProvinsi.findOne({
      where: { kode: KodeProv },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data provinsi", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createProvinsi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { provinsi, kode } = req.body;
  try {
    const data = await RefProvinsi.create({
      provinsi,
      kode,
    });
    return successResponse(res, "Berhasil menambahkan data provinsi", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateProvinsi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { provinsi, kode } = await req.body;
  const { KodeProv } = req.params;
  try {
    const data = await RefProvinsi.findOne({
      where: { kode: KodeProv },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (provinsi) data.provinsi = provinsi;
    if (kode) data.kode = kode;
    await data.save();
    return successResponse(res, "Berhasil mengubah data provinsi");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteProvinsi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv } = req.params;
  try {
    const data = await RefProvinsi.findOne({
      where: { kode: KodeProv },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data provinsi");
  } catch (error: unknown) {
    next(error);
  }
};

export const getAllKota = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv } = req.params;
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    const whereClause: any = {
      kode_provinsi: KodeProv,
    };
    if (search) {
      whereClause[Op.or] = [
        where(col("kota"), { [Op.like]: `%${search}%` }),
        where(col("kode"), { [Op.like]: `%${search}%` }),
      ];
    }
    const { rows: data, count } = await RefKota.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil data pegawai", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getKotaById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv, KodeKota } = req.params;
  try {
    const data = await RefKota.findOne({
      where: { kode: KodeKota, kode_provinsi: KodeProv },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data provinsi", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createKota = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv } = req.params;
  try {
    const { kota, kode } = req.body;
    const data = await RefKota.create({
      kota,
      kode,
      kode_provinsi: KodeProv,
    });
    return successResponse(res, "Berhasil menambahkan data kota", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateKota = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv, KodeKota } = req.params;
  try {
    const { kota, kode } = req.body;
    const data = await RefKota.findOne({
      where: { kode: KodeKota, kode_provinsi: KodeProv },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (kota) data.kota = kota;
    if (kode) data.kode = kode;
    await data.save();
    return successResponse(res, "Berhasil mengubah data kota");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteKota = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeProv, KodeKota } = req.params;
  try {
    const data = await RefKota.findOne({
      where: { kode: KodeKota, kode_provinsi: KodeProv },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data kota");
  } catch (error: unknown) {
    next(error);
  }
};
