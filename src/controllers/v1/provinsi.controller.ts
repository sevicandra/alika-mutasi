import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefProvinsi } from "@/repositories";

export const ProvinsiControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.provinsi = { [Op.like]: `%${search}%` };

    const { items: data, pagination } = await RefProvinsi.findAllWithPagination({
      limit,
      offset,
      order,
      where,
    });

    successResponse(res, "Success get all ref provinsi", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefProvinsi.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref provinsi", data);
  }),
  getByKode: asyncHandler(async (req: Request, res: Response) => {
    const { kode } = req.params;
    const data = await RefProvinsi.findOne({ where: { kode } });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref provinsi", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode, provinsi } = req.body;
    const data = await RefProvinsi.create({
      kode,
      provinsi,
    });
    successResponse(res, "Success create ref provinsi", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { kode, provinsi } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefProvinsi.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kode,
          provinsi,
        },
        t
      );
      successResponse(res, "Success update ref provinsi", data);
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
      const data = await RefProvinsi.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref provinsi", data);
    },
    {
      useTransaction: true,
    }
  ),
};
