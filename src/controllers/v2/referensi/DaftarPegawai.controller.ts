import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { KemenkeuService } from "@/services/kemenkeu.service";
import { AuthenticationError, InvalidRequestError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";

export const DaftarPegawaiControllerV2 = {
  hrisv1: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
    }
    const { kdSatker } = req.query;
    if (typeof kdSatker !== "string") {
      throw new InvalidRequestError("Kode satker tidak ditemukan");
    }
    const data = await KemenkeuService.getDaftarPegawai({ kdsatker: kdSatker });
    successResponse(
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
  }),
};
