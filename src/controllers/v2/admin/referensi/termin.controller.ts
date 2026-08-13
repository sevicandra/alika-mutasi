import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { RefTermin } from "@/repositories";

export const TerminControllerV2 = {
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

  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode, nama, required_doc, urutan } = req.body;

    const data = await RefTermin.create({
      kode,
      nama,
      required_doc,
      urutan,
    });
    successResponse(res, "Success create ref termin", data);
  }),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { id } = req.params;
      const { nama, required_doc, urutan } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefTermin.updateById(
        id,
        {
          nama,
          required_doc,
          urutan,
        },
        t
      );
      successResponse(res, "Success update ref termin", data);
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
      const data = await RefTermin.deleteById(id, t);
      successResponse(res, "Success delete ref termin", data);
    },
    {
      useTransaction: true,
    }
  ),
};
