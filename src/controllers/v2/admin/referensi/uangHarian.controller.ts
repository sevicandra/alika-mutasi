import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefUangHarian } from "@/repositories";

export const UangHarianControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("Provinsi.provinsi"), { [Op.like]: `%${search}%` }),
            where(col("Provinsi.kode"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};
    const { items: data, pagination } = await RefUangHarian.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      order,
      include: [
        {
          association: "Provinsi",
          attributes: ["id", "provinsi", "kode"],
        },
      ],
    });
    successResponse(
      res,
      "Success get all ref uang harian",
      data.map((item) => ({
        id: item.id,
        provinsi: item.Provinsi.provinsi,
        tarif: item.tarif,
      })),
      pagination
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await RefUangHarian.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref uang harian", data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode_provinsi, tarif } = req.body;
    const data = await RefUangHarian.create({
      kode_provinsi,
      tarif,
    });
    successResponse(res, "Success create ref uang harian", data);
  }),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { id } = req.params;
      const { kode_provinsi, tarif } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefUangHarian.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kode_provinsi,
          tarif,
        },
        t
      );
      successResponse(res, "Success update ref uang harian", data);
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
      const data = await RefUangHarian.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref uang harian", data);
    },
    {
      useTransaction: true,
    }
  ),
};
