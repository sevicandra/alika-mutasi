import { RefTimeline } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllTimeline = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sortField = (req.query.sortField as string) || "urutan";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const { rows: data, count } = await RefTimeline.findAndCountAll({
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(
      res,
      "Berhasil mengambil data referensi timeline",
      data,
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getTimelineById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefTimeline.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil data referensi timeline",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const createTimeline = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { kode, urutan, nama } = req.body;
    const data = await RefTimeline.create({
      kode,
      urutan,
      nama,
    });

    return successResponse(
      res,
      "Berhasil menambahkan data referensi timeline",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const updateTimeline = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const { kode, urutan, nama } = req.body;
    const data = await RefTimeline.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (kode) data.kode = kode;
    if (urutan) data.urutan = urutan;
    if (nama) data.nama = nama;
    await data.save();
    return successResponse(res, "Berhasil mengubah data referensi timeline");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteTimeline = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const data = await RefTimeline.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data referensi timeline");
  } catch (error: unknown) {
    next(error);
  }
};
