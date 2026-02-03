import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { DataSanggah } from "@/repositories";

export const DataSanggahControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { SanggahId } = req.params;
    if (typeof SanggahId != "string") {
      throw new InvalidRequestError("Invalid sanggah id");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { items: data, pagination } = await DataSanggah.findAllWithPagination({
      where: { sanggah_id: SanggahId },
      include: [
        {
          association: "Ref",
          attributes: ["nama", "nik", "tanggal_lahir", "pekerjaan", "status"],
        },
      ],
      limit,
      offset,
    });

    successResponse(res, "Berhasil mengambil data sanggah", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SanggahId, DataId } = req.params;
    if (typeof SanggahId != "string" || typeof DataId != "string") {
      throw new InvalidRequestError("Invalid sanggah id or data id");
    }
    const data = await DataSanggah.findOne({
      where: { sanggah_id: SanggahId, id: DataId },
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    successResponse(res, "Berhasil mengambil data sanggah", data);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { SanggahId, DataId } = req.params;
    if (typeof SanggahId != "string" || typeof DataId != "string") {
      throw new InvalidRequestError("Invalid sanggah id or data id");
    }
    const data = await DataSanggah.findOne({
      where: { sanggah_id: SanggahId, id: DataId },
      include: [
        {
          association: "Sanggah",
          attributes: ["ticket_number"],
          include: [
            {
              association: "Pegawai",
              attributes: ["nama"],
            },
          ],
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }

    const stream = await minioService.getFile(data.file);
    fileResponse(
      res,
      stream,
      `${data.Sanggah.ticket_number}_${data.Sanggah.Pegawai.nama}.pdf`,
      "application/pdf"
    );
  }),
};
