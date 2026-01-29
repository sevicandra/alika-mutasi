import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { PembayaranLog } from "@/repositories";

export const RiwayatControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { SkId, PegawaiId } = req.params;
    if (typeof SkId != "string" || typeof PegawaiId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PembayaranLog.findAll({
      where: { pegawai_id: PegawaiId },
      include: [
        {
          association: "Pegawai",
          where: {
            sk_id: SkId,
          },
        },
      ],
      attributes: {
        exclude: ["payload", "Pegawai"],
      },
      order: [["created_at", "ASC"]],
    });

    successResponse(res, "Berhasil mengambil data pegawai", data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SkId, PegawaiId, HistoryId } = req.params;

    if (typeof SkId != "string" || typeof PegawaiId != "string" || typeof HistoryId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PembayaranLog.findOne({
      where: {
        id: HistoryId,
        pegawai_id: PegawaiId,
      },
      include: [
        {
          association: "Pegawai",
          where: {
            sk_id: SkId,
          },
        },
      ],
      attributes: {
        include: ["payload", "action_type"],
      },
    });

    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Berhasil mengambil data pegawai", data);
  }),
};
