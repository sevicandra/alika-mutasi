import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AuthorizationError, InvalidRequestError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga } from "@/repositories";

export const KeluargaControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { mutasiId } = req.params;
    if (typeof mutasiId != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const { items: data, pagination } = await Keluarga.findAllWithPagination({
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
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all keluarga", data, pagination);
  }),
};
