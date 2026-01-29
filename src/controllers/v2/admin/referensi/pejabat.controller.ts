import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefPejabat } from "@/repositories";

export const pejabatControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const whereClause = search
      ? {
          [Op.or]: [where(col("jenis"), { [Op.like]: `%${search}%` })],
        }
      : {};

    const { items: data, pagination } = await RefPejabat.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all ref pejabat", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefPejabat.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref pejabat", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { jenis, nama, nip } = req.body;
    const data = await RefPejabat.create({
      jenis,
      nama,
      nip,
    });
    successResponse(res, "Success create ref pejabat", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { jenis, nama, nip } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefPejabat.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          jenis,
          nama,
          nip,
        },
        t
      );
      successResponse(res, "Success update ref pejabat", data);
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
      const data = await RefPejabat.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref pejabat", data);
    },
    {
      useTransaction: true,
    }
  ),
};
