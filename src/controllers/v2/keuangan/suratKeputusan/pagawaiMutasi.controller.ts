import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import sequelize from "@/config/db.config";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { PegawaiMutasi } from "@/repositories";

export const PegawaiMutasiController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
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
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { items: data, pagination } = await PegawaiMutasi.findAllWithPagination({
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

    successResponse(res, "Berhasil mendapatkan dokumen", data, pagination);
  }),
  count: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga = (req.query.process_keluarga as string) || undefined;
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
    const data = await PegawaiMutasi.count({ where });

    successResponse(res, "Berhasil mendapatkan dokumen", data);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PegawaiMutasi.findById(PegawaiId, {
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
      throw new NotFoundError("data tidak ditemukan");
    }
    successResponse(res, "Berhasil mendapatkan dokumen", data);
  }),
};
