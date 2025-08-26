import { Termin } from "@/models";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { errorResponse, successResponse } from "@/helpers/respose.helper";

export const getAllTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { PegawaiId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const where: any = {};
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const data = await Termin.findAll({
      where: where,
      limit: limit,
      offset: offset,
      order: [["urutan", "DESC"]],
    });
    const count = await Termin.count({
      where: where,
    });

    return successResponse(res, "Berhasil mengambil data termin", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getTerminById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, PegawaiId } = req.params;
    const data = await Termin.findByPk(id);
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    if (data.pegawai_id !== PegawaiId) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data termin", data);
  } catch (error: unknown) {
    next(error);
  }
};
