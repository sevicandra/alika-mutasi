import { RefDarat } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "kota_asal";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("rute"), { [Op.like]: `%${search}%` }),
            where(col("KotaAsal.kota"), { [Op.like]: `%${search}%` }),
            where(col("KotaTujuan.kota"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { rows: data, count } = await RefDarat.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
      include: [
        {
          association: "KotaAsal",
          attributes: ["id", "kota", "kode"],
          include: [
            {
              association: "Provinsi",
              attributes: ["id", "provinsi", "kode"],
            },
          ],
        },
        {
          association: "KotaTujuan",
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
      "Berhasil mengambil data darat",
      data.map((item) => ({
        id: item.id,
        kota_asal: item.KotaAsal.kota,
        provinsi_asal: item.KotaAsal.Provinsi.provinsi,
        kota_tujuan: item.KotaTujuan.kota,
        provinsi_tujuan: item.KotaTujuan.Provinsi.provinsi,
        rute: item.rute,
        jarak: item.jarak,
        pulau: item.pulau,
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

export const getDaratById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefDarat.findByPk(id, {
      include: [
        {
          association: "KotaAsal",
          attributes: ["kode_provinsi"],
        },
        {
          association: "KotaTujuan",
          attributes: ["kode_provinsi"],
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data darat", {
      id: data.id,
      kota_asal: data.kota_asal,
      provinsi_asal: data.KotaAsal.kode_provinsi,
      kota_tujuan: data.kota_tujuan,
      provinsi_tujuan: data.KotaTujuan.kode_provinsi,
      rute: data.rute,
      jarak: data.jarak,
      pulau: data.pulau,
    });
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
    const { kota_asal, kota_tujuan, jarak, pulau, rute } = req.body;

    const data = await RefDarat.create({
      kota_asal,
      kota_tujuan,
      jarak,
      pulau,
      rute,
    });

    return successResponse(res, "Berhasil menambahkan data darat", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { kota_asal, kota_tujuan, jarak, pulau, rute } = req.body;
    const data = await RefDarat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kota_asal) data.kota_asal = kota_asal;
    if (kota_tujuan) data.kota_tujuan = kota_tujuan;
    if (jarak) data.jarak = jarak;
    if (pulau) data.pulau = pulau;
    if (rute) data.rute = rute;
    await data.save();
    return successResponse(res, "Berhasil mengubah data darat");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteDarat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefDarat.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data darat");
  } catch (error: unknown) {
    next(error);
  }
};
