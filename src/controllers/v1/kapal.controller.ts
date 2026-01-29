import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefKapal } from "@/repositories";

export const KapalControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const kota_asal = req.query.kota_asal || undefined;
    const kota_tujuan = req.query.kota_tujuan || undefined;
    const kapal = req.query.kapal || undefined;
    const where: any = {};
    if (search) where.rute = { [Op.like]: `%${search}%` };
    if (kota_asal) where.kota_asal = kota_asal;
    if (kota_tujuan) where.kota_tujuan = kota_tujuan;
    if (kapal) where.kapal = kapal;

    const { items: data, pagination } = await RefKapal.findAllWithPagination({
      where,
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

    const data = await RefKapal.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref kapal", data);
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
