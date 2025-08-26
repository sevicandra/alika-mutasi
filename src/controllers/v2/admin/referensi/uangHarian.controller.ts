import { RefUangHarian } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "kode_provinsi";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("Provinsi.provinsi"), { [Op.like]: `%${search}%` }),
            where(col("Provinsi.kode"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { rows: data, count } = await RefUangHarian.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
      include: [
        {
          association: "Provinsi",
          attributes: ["id", "provinsi", "kode"],
        },
      ],
    });
    return successResponse(
      res,
      "Berhasil mengambil data uang harian",
      data.map((item) => ({
        id: item.id,
        provinsi: item.Provinsi.provinsi,
        tarif: item.tarif,
      })),
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

export const getUangHarianById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefUangHarian.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data uang harian", data);
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
    const data = await RefUangHarian.create({
      kode_provinsi,
      tarif,
    });

    return successResponse(res, "Berhasil menambahkan data uang harian", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { kode_provinsi, tarif } = req.body;
    const data = await RefUangHarian.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kode_provinsi) data.kode_provinsi = kode_provinsi;
    if (tarif) data.tarif = tarif;
    await data.save();
    return successResponse(res, "Berhasil mengubah data uang harian");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteUangHarian = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefUangHarian.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data uang harian");
  } catch (error: unknown) {
    next(error);
  }
};
