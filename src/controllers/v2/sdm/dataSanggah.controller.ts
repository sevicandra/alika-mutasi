import { DataSanggah } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { MinioService } from "@/services/minio.service";
const minioService = new MinioService();

export const getAllDataSanggah = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SanggahId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;

    const { rows: data, count } = await DataSanggah.findAndCountAll({
      where: { sanggah_id: SanggahId },
      include: [
        {
          association: "Ref",
        },
        {
          association: "Sanggah",
        },
      ],
      limit,
      offset,
    });
    return successResponse(res, "Berhasil mengambil data sanggah", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getDataSanggahById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SanggahId, DataId } = req.params;
    const data = await DataSanggah.findOne({
      where: {
        sanggah_id: SanggahId,
        id: DataId,
      },
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data, 200);
  } catch (error: unknown) {
    next(error);
  }
};

export const getSuratKeputusanFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SanggahId, DataId } = req.params;
    const data = await DataSanggah.findOne({
      where: {
        sanggah_id: SanggahId,
        id: DataId,
      },
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const stream = await minioService.downloadFile(`${data.file}`);
    if (stream) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=");
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    }
  } catch (error: unknown) {
    next(error);
  }
};
