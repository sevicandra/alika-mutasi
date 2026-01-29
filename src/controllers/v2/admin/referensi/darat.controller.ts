import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefDarat } from "@/repositories";

export const DaratControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);

    const whereClause = search
      ? {
          [Op.or]: [
            where(col("rute"), { [Op.like]: `%${search}%` }),
            where(col("KotaAsal.kota"), { [Op.like]: `%${search}%` }),
            where(col("KotaTujuan.kota"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};

    const { items: data, pagination } = await RefDarat.findAllWithPagination({
      limit,
      offset,
      order,
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
    });

    successResponse(res, "Success get all ref darat", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefDarat.findById(id, {
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

    successResponse(res, "Success get ref darat", {
      id: data.id,
      rute: data.rute,
      kota_asal: data.kota_asal,
      provinsi_asal: data.KotaAsal.kode_provinsi,
      kota_tujuan: data.kota_tujuan,
      provinsi_tujuan: data.KotaTujuan.kode_provinsi,
      jarak: data.jarak,
      pulau: data.pulau,
    });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { rute, kota_asal, kota_tujuan, jarak, pulau } = req.body;
    const data = await RefDarat.create({
      rute,
      kota_asal,
      kota_tujuan,
      jarak,
      pulau,
    });
    successResponse(res, "Success create ref darat", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { rute, kota_asal, kota_tujuan, jarak, pulau } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefDarat.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          rute,
          kota_asal,
          kota_tujuan,
          jarak,
          pulau,
        },
        t
      );
      successResponse(res, "Success update ref darat", data);
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
      const data = await RefDarat.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref darat", data);
    },
    {
      useTransaction: true,
    }
  ),
};
