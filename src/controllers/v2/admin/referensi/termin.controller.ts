import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { RefTermin } from "@/repositories";

export const TerminController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "urutan";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const { items: data, pagination } = await RefTermin.findAllWithPagination({
      limit,
      offset,
      order,
    });
    successResponse(res, "Berhasil mengambil referensi termin ", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await RefTermin.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref termin", data);
  }),
};
