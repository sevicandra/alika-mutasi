import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefTimeline } from "@/repositories";

export const TimelineControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { items: data, pagination } = await RefTimeline.findAllWithPagination({
      limit,
      offset,
      order,
    });
    successResponse(res, "Success get all ref timeline", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await RefTimeline.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref timeline", data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode, urutan, nama } = req.body;
    const data = await RefTimeline.create({
      kode,
      urutan,
      nama,
    });
    successResponse(res, "Success create ref timeline", data);
  }),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { id } = req.params;
      const { kode, urutan, nama } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefTimeline.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          kode,
          urutan,
          nama,
        },
        t
      );
      successResponse(res, "Success update ref timeline", data);
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
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefTimeline.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete ref timeline", data);
    },
    {
      useTransaction: true,
    }
  ),
};
