import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefKantor } from "@/repositories";

export const KantorControllerV2 = {
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
    const { KodeSatker } = req.params;

    if (typeof KodeSatker !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefKantor.findOne({
      where: {
        kode_satker: KodeSatker,
      },
      include: [
        {
          association: "Kota",
          attributes: [],
        },
      ],
      attributes: {
        include: [[col("Kota.kode_provinsi"), "kode_provinsi"]],
      },
    });
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
      const { KodeSatker } = req.params;
      const { kode_kota, kode_satker, kantor } = req.body;
      if (typeof KodeSatker !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefKantor.updateOne(
        {
          where: {
            kode_satker: KodeSatker,
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
      const { KodeSatker } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof KodeSatker !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefKantor.deleteOne(
        {
          where: {
            kode_satker: KodeSatker,
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
