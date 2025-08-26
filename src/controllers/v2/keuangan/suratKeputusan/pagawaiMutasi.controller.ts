import { PegawaiMutasi } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import sequelize from "@/config/db.config";

export const getAllPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      sk_id: SkId,
    };
    if (kantor_asal) where.kantor_asal = kantor_asal;
    if (kantor_tujuan) where.kantor_tujuan = kantor_tujuan;
    if (nip) where.nip = nip;
    if (status) where.status = status;
    if (search)
      where[Op.or] = [
        {
          nama: { [Op.like]: `%${search}%` },
        },
        {
          nip: { [Op.like]: `%${search}%` },
        },
      ];
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const { rows: data, count } = await PegawaiMutasi.findAndCountAll({
      where,
      limit,
      offset,
      order,
      attributes: [
        "id",
        "sk_id",
        "nip",
        "nama",
        "status",
        [sequelize.col("KantorAsal.kantor"), "kantor_asal"],
        [sequelize.col("KantorTujuan.kantor"), "kantor_tujuan"],
        [sequelize.col("Golongan.kode"), "kode_golongan"],
        [sequelize.col("Golongan.nama"), "nama_golongan"],
        [sequelize.col("MonitoringTagihan.total_tagihan"), "total_tagihan"],
      ],
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: {
              [Op.ne]: "DRAFT",
            },
          },
          attributes: [],
        },
        {
          association: "MonitoringTagihan",
          attributes: [],
        },
        {
          association: "KantorAsal",
          attributes: [],
        },
        {
          association: "KantorTujuan",
          attributes: [],
        },
        {
          association: "Golongan",
          attributes: [],
        },
      ],
      raw: true,
    });

    return successResponse(
      res,
      "Berhasil mengambil data pegawai mutasi",
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

export const countAllPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga =
      (req.query.process_keluarga as string) || undefined;
    const process_biaya = (req.query.process_biaya as string) || undefined;
    const where: any = {
      sk_id: SkId,
    };
    if (kantor_asal) where.kantor_asal = kantor_asal;
    if (kantor_tujuan) where.kantor_tujuan = kantor_tujuan;
    if (nip) where.nip = nip;
    if (status) where.status = status;
    if (process_keluarga) where.process_keluarga = process_keluarga;
    if (process_biaya) where.process_biaya = process_biaya;
    if (search)
      where[Op.or] = [
        {
          nama: { [Op.like]: `%${search}%` },
        },
        {
          nip: { [Op.like]: `%${search}%` },
        },
      ];
    const count = await PegawaiMutasi.count({ where });
    return successResponse(
      res,
      "Berhasil menghitung data pegawai mutasi",
      count
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getPegawaiMutasiById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const data = await PegawaiMutasi.findByPk(PegawaiId, {
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal", "status"],
          where: {
            id: SkId,
          },
        },
        {
          association: "MonitoringTagihan",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data pegawai mutasi", data);
  } catch (error: unknown) {
    next(error);
  }
};
