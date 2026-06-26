import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga } from "@/repositories";

export const KeluargaController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.nama = { [Op.like]: `%${search}%` };
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const { items: data, pagination } = await Keluarga.findAllWithPagination({
      where,
      limit,
      offset,
      order,
      include: [
        {
          association: "Ref",
          attributes: ["nama"],
        },
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            sk_id: SkId,
          },
        },
      ],
    });

    successResponse(res, "Berhasil mendapatkan dokumen", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { KeluargaId, PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string" || typeof KeluargaId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Keluarga.findById(KeluargaId, {
      include: [
        {
          association: "Ref",
          attributes: ["nama"],
        },
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            sk_id: SkId,
          },
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    successResponse(res, "Berhasil mendapatkan dokumen", data);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { KeluargaId, PegawaiId } = req.params;
    if (typeof PegawaiId != "string" || typeof KeluargaId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Keluarga.findOne({
      where: {
        id: KeluargaId,
        pegawai_id: PegawaiId,
      },
    });
    if (!data || !data.file) {
      throw new NotFoundError("data tidak ditemukan");
    }
    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.nama}.pdf`, "application/pdf");
  }),
};
