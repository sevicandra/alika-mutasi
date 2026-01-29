import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefKantor } from "@/repositories";

export const KantorControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
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

    const { items: data, pagination } = await RefKantor.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all ref kantor", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefKantor.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref kantor", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode_kota, kode_satker, kantor } = req.body;
    const data = await RefKantor.create({
      kode_kota,
      kode_satker,
      kantor,
    });
    successResponse(res, "Success create ref kantor", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { kode_kota, kode_satker, kantor } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefKantor.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kode_kota,
          kode_satker,
          kantor,
        },
        t
      );
      successResponse(res, "Success update ref kantor", data);
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
      const data = await RefKantor.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref kantor", data);
    },
    {
      useTransaction: true,
    }
  ),
};
