import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefKota } from "@/repositories";

export const KotaControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.kota = { [Op.like]: `%${search}%` };
    const { items: data, pagination } = await RefKota.findAllWithPagination({
      where,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all ref kota", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefKota.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref kota", data);
  }),
  getByKode: asyncHandler(async (req: Request, res: Response) => {
    const { kode } = req.params;
    const data = await RefKota.findOne({ where: { kode } });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref kota", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode_provinsi, kode, kota } = req.body;
    const data = await RefKota.create({
      kode_provinsi,
      kode,
      kota,
    });
    successResponse(res, "Success create ref kota", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { kode_provinsi, kode, kota } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefKota.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kode_provinsi,
          kode,
          kota,
        },
        t
      );
      successResponse(res, "Success update ref kota", data);
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
      const data = await RefKota.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref kota", data);
    },
    {
      useTransaction: true,
    }
  ),
};
