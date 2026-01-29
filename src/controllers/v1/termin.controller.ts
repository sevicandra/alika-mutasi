import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Termin } from "@/repositories";

export const TerminControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const where: any = {};
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const { items: data, pagination } = await Termin.findAllWithPagination({
      where,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all termin", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id, PegawaiId } = req.params;

    if (typeof id !== "string" || (PegawaiId && typeof PegawaiId !== "string")) {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await Termin.findOne({
      where: {
        id: id,
        pegawai_id: PegawaiId,
      },
    });
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get termin", data);
  }),
};
