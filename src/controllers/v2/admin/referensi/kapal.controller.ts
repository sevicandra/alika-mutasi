import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefKapal } from "@/repositories";

export const KapalControllerV2 = {
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

    const { items: data, pagination } = await RefKapal.findAllWithPagination({
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

    successResponse(res, "Success get all ref kapal", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefKapal.findById(id, {
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

    successResponse(res, "Success get ref kapal", {
      id: data.id,
      kapal: data.kapal,
      rute: data.rute,
      kota_asal: data.kota_asal,
      provinsi_asal: data.KotaAsal.kode_provinsi,
      kota_tujuan: data.kota_tujuan,
      provinsi_tujuan: data.KotaTujuan.kode_provinsi,
      tarif: data.tarif,
    });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kapal, rute, kota_asal, kota_tujuan, tarif } = req.body;
    const data = await RefKapal.create({
      kapal,
      rute,
      kota_asal,
      kota_tujuan,
      tarif,
    });
    successResponse(res, "Success create ref kapal", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { kapal, rute, kota_asal, kota_tujuan, tarif } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefKapal.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kapal,
          rute,
          kota_asal,
          kota_tujuan,
          tarif,
        },
        t
      );
      successResponse(res, "Success update ref kapal", data);
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
      const data = await RefKapal.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref kapal", data);
    },
    {
      useTransaction: true,
    }
  ),
};
