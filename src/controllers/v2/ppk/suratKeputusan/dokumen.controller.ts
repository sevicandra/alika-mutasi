import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { DokumenTermin } from "@/repositories";

export const DokumenController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId, TerminId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string" || typeof TerminId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;

    const whereClause = {
      [Op.and]: [
        where(col("Termin.id"), TerminId),
        where(col("Termin.Pegawai.id"), PegawaiId),
        where(col("Termin.Pegawai.SuratKeputusan.id"), SkId),
        where(col("Termin.Pegawai.SuratKeputusan.status"), { [Op.ne]: "DRAFT" }),
      ],
    };

    const { items: data, pagination } = await DokumenTermin.findAllWithPagination({
      where: whereClause,
      include: [
        {
          association: "Termin",
          attributes: [],
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
        },
      ],
      limit,
      offset,
    });

    successResponse(res, "Berhasil mendapatkan dokumen", data, pagination);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { SkId, PegawaiId, TerminId, DokumenId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string" || typeof TerminId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const whereClause = {
      id: DokumenId,
      [Op.and]: [
        where(col("Termin.id"), TerminId),
        where(col("Termin.Pegawai.id"), PegawaiId),
        where(col("Termin.Pegawai.SuratKeputusan.id"), SkId),
        where(col("Termin.Pegawai.SuratKeputusan.status"), { [Op.ne]: "DRAFT" }),
      ],
    };

    const data = await DokumenTermin.findOne({
      where: whereClause,
      include: [
        {
          association: "Termin",
          attributes: [],
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
        },
      ],
    });
    if (!data || !data.file) {
      throw new NotFoundError("data tidak ditemukan");
    }
    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.document_type}.pdf`, "application/pdf");
  }),
};
