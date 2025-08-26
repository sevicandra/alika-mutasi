import { RefKantor } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllKantor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "kode_kota";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("kode_satker"), { [Op.like]: `%${search}%` }),
            where(col("kantor"), { [Op.like]: `%${search}%` }),
            where(col("Kota.kota"), { [Op.like]: `%${search}%` }),
            where(col("Kota.kode"), { [Op.like]: `%${search}%` }),
            where(col("Kota.Provinsi.provinsi"), { [Op.like]: `%${search}%` }),
            where(col("Kota.Provinsi.kode"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { rows: data, count } = await RefKantor.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
      include: [
        {
          association: "Kota",
          attributes: ["id", "kota", "kode"],
          include: [
            {
              association: "Provinsi",
              attributes: ["id", "provinsi", "kode"],
            },
          ],
        },
      ],
    });
    return successResponse(
      res,
      "Berhasil mengambil data kantor",
      data.map((item) => ({
        kode_satker: item.kode_satker,
        kantor: item.kantor,
        kota: item.Kota.kota,
        provinsi: item.Kota.Provinsi.provinsi,
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

export const getKantorById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeSatker } = req.params;
  try {
    const data = await RefKantor.findOne({
      where: { kode_satker: KodeSatker },
      include: [
        {
          association: "Kota",
          attributes: ["kode_provinsi"],
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data kantor", {
      kode_satker: data.kode_satker,
      kantor: data.kantor,
      kode_kota: data.kode_kota,
      kode_provinsi: data.Kota.kode_provinsi,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const createKantor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { kantor, kode_satker, kode_kota } = req.body;
    const data = await RefKantor.create({
      kantor,
      kode_satker,
      kode_kota,
    });

    return successResponse(res, "Berhasil menambahkan data kantor", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateKantor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeSatker } = req.params;
  try {
    const { kantor, kode_satker, kode_kota } = req.body;
    const data = await RefKantor.findOne({
      where: { kode_satker: KodeSatker },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kantor) data.kantor = kantor;
    if (kode_satker) data.kode_satker = kode_satker;
    if (kode_kota) data.kode_kota = kode_kota;
    await data.save();
    return successResponse(res, "Berhasil mengubah data kantor");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteKantor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KodeSatker } = req.params;
  try {
    const data = await RefKantor.findOne({
      where: { kode_satker: KodeSatker },
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data kantor");
  } catch (error: unknown) {
    next(error);
  }
};
