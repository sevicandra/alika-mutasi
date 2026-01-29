import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefGolongan } from "@/repositories";

export const GolonganControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("kode"), { [Op.like]: `%${search}%` }),
            where(col("nama"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { items: data, pagination } = await RefGolongan.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all ref golongan", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefGolongan.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref golongan", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode, nama } = req.body;
    const data = await RefGolongan.create({
      kode,
      nama,
    });
    successResponse(res, "Success create ref golongan", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { kode, nama } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefGolongan.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kode,
          nama,
        },
        t
      );
      successResponse(res, "Success update ref golongan", data);
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
      const data = await RefGolongan.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref golongan", data);
    },
    {
      useTransaction: true,
    }
  ),
};
