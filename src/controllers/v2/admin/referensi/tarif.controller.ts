import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefTarif } from "@/repositories";

export const TarifControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const whereClause = search
      ? {
          [Op.or]: [where(col("jenis"), { [Op.like]: `%${search}%` })],
        }
      : {};
    const { items: data, pagination } = await RefTarif.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all ref tarif", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await RefTarif.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref tarif", data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { tarif, jenis } = req.body;
    const data = await RefTarif.create({
      tarif,
      jenis,
    });
    successResponse(res, "Success create ref tarif", data);
  }),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { id } = req.params;
      const { tarif, jenis } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefTarif.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          tarif,
          jenis,
        },
        t
      );
      successResponse(res, "Success update ref tarif", data);
    },
    {
      useTransaction: true,
    }
  ),

  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { id } = req.params;
      const data = await RefTarif.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref tarif", data);
    },
    {
      useTransaction: true,
    }
  ),
};
