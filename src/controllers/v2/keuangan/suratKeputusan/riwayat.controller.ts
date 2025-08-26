import { PembayaranLog } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { SkId, PegawaiId } = req.params;
  try {
    const data = await PembayaranLog.findAll({
      where: {
        pegawai_id: PegawaiId,
      },
      include: [
        {
          association: "Pegawai",
          where: {
            sk_id: SkId,
          },
          include: [
            {
              association: "SuratKeputusan",
              where: {
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
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

    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const getHistoryById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { SkId, PegawaiId, HistoryId } = req.params;
  try {
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
          attributes: [],
          include: [
            {
              association: "SuratKeputusan",
              where: {
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
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
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};
