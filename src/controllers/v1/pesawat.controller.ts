import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefPesawat } from "@/repositories";

export const PesawatControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const kota_asal = req.query.kota_asal || undefined;
    const kota_tujuan = req.query.kota_tujuan || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search) where.rute = { [Op.like]: `%${search}%` };
    if (kota_asal) where.kota_asal = kota_asal;
    if (kota_tujuan) where.kota_tujuan = kota_tujuan;

    const { items: data, pagination } = await RefPesawat.findAllWithPagination({
      limit,
      offset,
      order,
      where,
    });

    successResponse(res, "Success get all ref pesawat", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefPesawat.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref pesawat", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { rute, kota_asal, kota_tujuan, ekonomi, bisnis, jenis_tarif } = req.body;
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
      const { rute, kota_asal, kota_tujuan, ekonomi, bisnis, jenis_tarif } = req.body;
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
