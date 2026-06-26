import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { PembayaranLog } from "@/repositories";

export const riwayatController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { SkId, PegawaiId } = req.params;

    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const whereClause = {
      [Op.and]: [
        where(col("Pegawai.id"), PegawaiId),
        where(col("Pegawai.SuratKeputusan.id"), SkId),
        where(col("Pegawai.SuratKeputusan.status"), { [Op.ne]: "DRAFT" }),
      ],
    };

    const data = await PembayaranLog.findAll({
      where: whereClause,
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "SuratKeputusan",
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],

      attributes: {
        exclude: ["payload", "Pegawai"],
      },
      order: [["created_at", "ASC"]],
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }

    successResponse(res, "data berhasil didapatkan", data);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SkId, PegawaiId, HistoryId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string" || typeof HistoryId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const whereClause = {
      id: HistoryId,
      [Op.and]: [
        where(col("Pegawai.id"), PegawaiId),
        where(col("Pegawai.SuratKeputusan.id"), SkId),
        where(col("Pegawai.SuratKeputusan.status"), { [Op.ne]: "DRAFT" }),
      ],
    };
    const data = await PembayaranLog.findOne({
      where: whereClause,
      include: [
        {
          association: "Pegawai",
          attributes: [],
          include: [
            {
              association: "SuratKeputusan",
              attributes: [],
            },
          ],
        },
      ],
      attributes: {
        include: ["payload", "action_type"],
      },
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    successResponse(res, "data berhasil didapatkan", data);
  }),
};
