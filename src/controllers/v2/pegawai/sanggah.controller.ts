import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
import { AuthorizationError, InternalServerError, InvalidRequestError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { DataSanggah, PegawaiMutasi, Sanggah } from "@/repositories";
import { PengajuanSanggah } from "@/types/pembayaranLog";

export const SanggahController = {
  getSanggah: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId } = req.params;

      if (typeof mutasiId != "string") {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const data = await Sanggah.getSanggah(mutasiId, t);
      successResponse(res, "data berhasil didapatkan", data);
    },
    {
      useTransaction: true,
    }
  ),
  kirim: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId } = req.params;

      if (typeof mutasiId != "string") {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const sanggah = await Sanggah.getSanggah(mutasiId, t);
      const logPayload: PengajuanSanggah[] = [];
      sanggah.status = "PENDING";
      await sanggah.save({ transaction: t });
      const data = await DataSanggah.findAll({
        where: {
          sanggah_id: sanggah.id,
        },
        include: [
          {
            association: "Ref",
          },
        ],
      });

      if (data.length === 0) {
        throw new InvalidRequestError("Data tidak ditemukan");
      }

      data.forEach((item) => {
        logPayload.push({
          action: item.action,
          nama: item.Ref?.nama,
          data: item.new_value as any,
          catatan: item.reason,
          file: item.file,
          id: item.keluarga_id,
        });
      });

      await Logger.SanggahanDiajukan({
        pegawai_id: mutasiId,
        actor_nip: nip,
        action: "Pengajuan Sanggah Data Keluarga",
        description: null,
        payload: logPayload,
        transaction: t,
      });

      const userSDM = await AlikaService.getUserSDM();
      await AlikaService.sendBulkPushNotification({
        nip: userSDM.map((user) => user.nip),
        message: `${sanggah.Pegawai.nama} mengajukan sanggah data keluarga`,
        title: "Pengajuan Sanggahan Data Keluarga",
      });

      await PegawaiMutasi.updateById(
        mutasiId,
        {
          status: "DISPUTED",
        },
        t
      );
      successResponse(res, "data berhasil dikirim");
    },
    {
      useTransaction: true,
    }
  ),
};
