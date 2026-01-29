import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AuthorizationError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { RincianBiaya } from "@/repositories";

export const RincianBiayaControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { mutasiId } = req.params;

    const { items: data, pagination } = await RincianBiaya.findAllWithPagination({
      where: {
        pegawai_id: mutasiId,
      },
      order: [
        ["jenis", "ASC"],
        ["urutan", "ASC"],
      ],
      include: [
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
      limit,
      offset,
    });

    successResponse(res, "Success get all rincian biaya", data, pagination);
  }),
};
