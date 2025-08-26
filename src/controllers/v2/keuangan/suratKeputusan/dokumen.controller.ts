import { DokumenTermin } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { MinioService } from "@/services/minio.service";
const minioService = new MinioService();

export const getAllDokumen = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { PegawaiId, SkId, TerminId } = req.params;
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { rows: data, count } = await DokumenTermin.findAndCountAll({
      where: {
        termin_id: TerminId,
      },
      include: [
        {
          association: "Termin",
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
          attributes: [],
        },
      ],
      limit,
      offset,
    });

    return successResponse(res, "Berhasil mendapatkan dokumen", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getDokumenFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId, PegawaiId, TerminId, DokumenId } = req.params;
    const data = await DokumenTermin.findOne({
      where: {
        termin_id: TerminId,
        id: DokumenId,
      },
      include: [
        {
          association: "Termin",
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
          attributes: [],
        },
      ],
    });
    if (!data || !data.file) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const stream = await minioService.downloadFile(`${data.file}`);
    if (stream) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${data.document_type}.pdf"`
        );
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    } else {
      throw new Error("File tidak ditemukan");
    }
  } catch (error: unknown) {
    next(error);
  }
};
