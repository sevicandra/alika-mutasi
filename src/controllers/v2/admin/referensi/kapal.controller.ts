import { RefKapal } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";

export const getAllKapal = async (
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
    const { rows: data, count } = await RefKapal.findAndCountAll({
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
      "Berhasil mengambil data kapal",
      data.map((item) => ({
        id: item.id,
        kota_asal: item.KotaAsal.kota,
        provinsi_asal: item.KotaAsal.Provinsi.provinsi,
        kota_tujuan: item.KotaTujuan.kota,
        provinsi_tujuan: item.KotaTujuan.Provinsi.provinsi,
        rute: item.rute,
        tarif: item.tarif,
        kapal: item.kapal,
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

export const getKapalById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefKapal.findByPk(id, {
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
    return successResponse(res, "Berhasil mengambil data kapal", {
      id: data.id,
      kota_asal: data.kota_asal,
      provinsi_asal: data.KotaAsal.kode_provinsi,
      kota_tujuan: data.kota_tujuan,
      provinsi_tujuan: data.KotaTujuan.kode_provinsi,
      rute: data.rute,
      tarif: data.tarif,
      kapal: data.kapal,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const createKapal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { kota_asal, kota_tujuan, tarif, kapal, rute } = req.body;
    const data = await RefKapal.create({
      kota_asal,
      kota_tujuan,
      tarif,
      kapal,
      rute,
    });

    return successResponse(res, "Berhasil menambahkan data kapal", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateKapal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { kota_asal, kota_tujuan, tarif, kapal, rute } = req.body;
    const data = await RefKapal.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kota_asal) data.kota_asal = kota_asal;
    if (kota_tujuan) data.kota_tujuan = kota_tujuan;
    if (tarif) data.tarif = tarif;
    if (kapal) data.kapal = kapal;
    if (rute) data.rute = rute;
    await data.save();
    return successResponse(res, "Berhasil mengubah data kapal");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteKapal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefKapal.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data kapal");
  } catch (error: unknown) {
    next(error);
  }
};
