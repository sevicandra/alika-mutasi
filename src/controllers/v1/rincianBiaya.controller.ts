import { RincianBiaya } from "@/models";
import { successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";

export const getAllRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { PegawaiId } = req.params;
    const pegawai_id = req.params.pegawai_id || undefined;
    const where: any = {};
    if (PegawaiId || pegawai_id) where.pegawai_id = PegawaiId || pegawai_id;
    const rincianBiaya = await RincianBiaya.findAll({
      where,
      order: [
        ["jenis", "ASC"],
        ["urutan", "ASC"],
      ],
    });
    return successResponse(
      res,
      "Berhasil mendapatkan rincian biaya",
      rincianBiaya
    );
  } catch (error: unknown) {
    next(error);
  }
};
