import { PembayaranLog } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllHistory = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { mutasiId } = req.params;
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const data = await PembayaranLog.findAll({
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

    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const getHistoryById = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { mutasiId, historyId } = req.params;
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
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
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error)
  }
};
