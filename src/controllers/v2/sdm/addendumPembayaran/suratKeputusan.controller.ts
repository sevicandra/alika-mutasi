import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { SuratKeputusan } from "@/repositories";

export const SuratKeputusanControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const jenjang = (req.query.jenjang as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search)
      where[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];
    where.status = "SELESAI";
    if (jenjang) where.jenjang = jenjang.toUpperCase();
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { items: data, pagination } = await SuratKeputusan.findAllWithPagination({
      where,
      order,
      limit,
      offset,
    });

    successResponse(res, "Berhasil mendapatkan data surat keputusan", data, pagination);
  }),
};
