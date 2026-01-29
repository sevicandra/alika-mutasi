import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefPesawat } from "@/repositories";

export const pesawatControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("rute"), { [Op.like]: `%${search}%` }),
            where(col("KotaAsal.kota"), { [Op.like]: `%${search}%` }),
            where(col("KotaTujuan.kota"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};

    const { items: data, pagination } = await RefPesawat.findAllWithPagination({
      where: whereClause,
      include: [
        {
          association: "KotaAsal",
          attributes: ["kode", "kota"],
        },
        {
          association: "KotaTujuan",
          attributes: ["kode", "kota"],
        },
      ],
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all ref pesawat", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefPesawat.findById(id, {
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
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Berhasil mengambil data pesawat", {
      id: data.id,
      kota_asal: data.kota_asal,
      provinsi_asal: data.KotaAsal.kode_provinsi,
      kota_tujuan: data.kota_tujuan,
      provinsi_tujuan: data.KotaTujuan.kode_provinsi,
      rute: data.rute,
      ekonomi: data.ekonomi,
      bisnis: data.bisnis,
      jenis_tarif: data.jenis_tarif,
    });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kota_asal, kota_tujuan, ekonomi, bisnis, rute, jenis_tarif } = req.body;
    const data = await RefPesawat.create({
      rute,
      kota_asal,
      kota_tujuan,
      ekonomi,
      bisnis,
      jenis_tarif,
    });
    successResponse(res, "Success create ref pesawat", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { kota_asal, kota_tujuan, ekonomi, bisnis, rute, jenis_tarif } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefPesawat.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          rute,
          kota_asal,
          kota_tujuan,
          ekonomi,
          bisnis,
          jenis_tarif,
        },
        t
      );
      successResponse(res, "Success update ref pesawat", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefPesawat.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref pesawat", data);
    },
    {
      useTransaction: true,
    }
  ),
};
