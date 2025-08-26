import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { Keluarga } from "@/models";

export const getAllKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { mutasiId } = req.params;
    const data = await Keluarga.findAll({
      where: {
        pegawai_id: mutasiId,
      },
      include: [
        {
          association: "Ref",
          attributes: ["nama", "jenis"],
        },
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            nip,
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
      ],
    });
    const count = await Keluarga.count({
      where: {
        pegawai_id: mutasiId,
      },
      include: [
        {
          association: "Ref",
          attributes: ["nama"],
        },
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            nip,
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
      ],
    });
    return successResponse(res, "Berhasil mengambil data keluarga", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};
