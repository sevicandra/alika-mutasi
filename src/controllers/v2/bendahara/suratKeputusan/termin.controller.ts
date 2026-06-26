import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import sequelize from "@/config/db.config";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Termin } from "@/repositories";

export const terminController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const where: any = {};
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { items: data, pagination } = await Termin.findAllWithPagination({
      where,
      limit,
      offset,
      order,
      attributes: [
        "id",
        "tahun",
        "nominal",
        "status",
        [sequelize.col("Ref.nama"), "nama"],
        [sequelize.col("Ref.urutan"), "urutan"],
      ],
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["id", "nomor", "tanggal"],
              where: {
                id: SkId,
              },
            },
          ],
        },
        {
          association: "Ref",
        },
      ],
    });

    successResponse(res, "Berhasil mendapatkan termin", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { TerminId, PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string" || typeof TerminId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await Termin.findOne({
      where: {
        id: TerminId,
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: [],
              where: {
                id: SkId,
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
        {
          association: "Ref",
        },
        {
          association: "DokumenTermin",
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    successResponse(res, "Berhasil mendapatkan termin", data);
  }),
};
