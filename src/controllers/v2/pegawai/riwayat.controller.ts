import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AuthorizationError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { PembayaranLog } from "@/repositories";

export const RiwayatControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId } = req.params;

    const { items: data, pagination } = await PembayaranLog.findAllWithPagination({
      where: {
        pegawai_id: mutasiId,
      },
      include: [
        {
          association: "Pegawai",
          where: {
            nip,
          },
        },
      ],
      attributes: {
        exclude: ["payload", "Pegawai"],
      },
      order: [["created_at", "ASC"]],
    });

    successResponse(res, "Success get all rincian biaya", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, historyId } = req.params;

    const data = await PembayaranLog.findOne({
      where: {
        id: historyId,
        pegawai_id: mutasiId,
      },
      include: [
        {
          association: "Pegawai",
          where: {
            nip,
          },
        },
      ],
      attributes: {
        include: ["payload", "action_type"],
      },
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    successResponse(res, "Success get all rincian biaya", data);
  }),
};
