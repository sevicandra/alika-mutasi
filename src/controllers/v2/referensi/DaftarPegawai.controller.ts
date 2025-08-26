import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { KemenkeuService } from "@/services/kemenkeu.service";

export const getAllPegawai = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const kdSatker = req.query.kdSatker as string;
    if (!kdSatker) {
      return errorResponse(res, "Kode satker tidak ditemukan", null, 400);
    }
    const data = await KemenkeuService.getDaftarPegawai({ kdsatker: kdSatker });
    return successResponse(
      res,
      "Berhasil mengambil data pegawai",
      data
        .filter((item) => item.StatusPegawai === "Aktif")
        .map((item) => ({
          nip: item.Nip18,
          nama: item.Nama,
          jenisJabatan: item.JenisJabatan,
        }))
        .sort((a, b) => a.nama.localeCompare(b.nama))
    );
  } catch (error: unknown) {
    next(error);
  }
};
