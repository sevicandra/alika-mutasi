import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Termin } from "@/repositories";

export const PermohonanPembayaranControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);

    const whereClause = search
      ? {
          [Op.or]: [
            where(col("Pegawai.nama"), { [Op.like]: `%${search}%` }),
            where(col("Pegawai.nip"), { [Op.like]: `%${search}%` }),
          ],
          status: "WAITING_APPROVAL_SDM",
        }
      : { status: "WAITING_APPROVAL_SDM" };

    const { items: data, pagination } = await Termin.findAllWithPagination({
      where: whereClause,
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["nomor", "jenjang"],
            },
            {
              association: "KantorAsal",
            },
            {
              association: "KantorTujuan",
            },
          ],
        },
        {
          association: "Ref",
        },
      ],
      limit,
      offset,
      order,
    });
    successResponse(res, "Berhasil mengambil data pegawai", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { permohonanId } = req.params;
    if (typeof permohonanId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Termin.findById(permohonanId, {
      include: [
        {
          association: "DokumenTermin",
        },
      ],
    });

    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Berhasil mengambil data pegawai", data);
  }),

  approve: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { permohonanId } = req.params;
      if (typeof permohonanId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { catatan } = await req.body;

      const data = await Termin.updateOne(
        {
          where: {
            id: permohonanId,
            status: "WAITING_APPROVAL_SDM",
          },
        },
        {
          status: "WAITING_APPROVAL_KEU",
        },
        t
      );
      await data.reload({
        include: [
          {
            association: "Pegawai",
            attributes: ["nip", "nama", "id"],
          },
          {
            association: "Ref",
            attributes: ["nama"],
          },
        ],
        transaction: t,
      });
      await Logger.GeneralAction({
        pegawai_id: data.Pegawai.id,
        actor_nip: nip,
        actor_role: "SDM",
        action: `Setujui permohonan pembayaran (${data.Ref.nama})`,
        description: catatan ? catatan : null,
        transaction: t,
      });
      const userKeu = await AlikaService.getUserKeu();
      await AlikaService.sendPushNotification({
        nip: data.Pegawai.nip,
        message:
          "Permohonan pembayaran telah disetujui oleh Bagian SDM dan diteruskan ke Bagian Keuangan",
      });
      await AlikaService.sendBulkPushNotification({
        nip: userKeu.map((user) => user.nip),
        message: `pembayaran mutasi atas nama ${data.Pegawai.nama} telah disetujui oleh bagian SDM`,
        title: "Pengajuan Pembayaran Mutasi",
      });
      successResponse(res, "Berhasil mengubah menyetujui permohonan", data);
    },
    {
      useTransaction: true,
    }
  ),

  reject: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { permohonanId } = req.params;
      if (typeof permohonanId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { catatan } = await req.body;

      const data = await Termin.updateOne(
        {
          where: {
            id: permohonanId,
            status: "WAITING_APPROVAL_SDM",
          },
        },
        {
          status: "REJECTED",
        },
        t
      );
      await data.reload({
        include: [
          {
            association: "Pegawai",
            attributes: ["nip", "nama", "id"],
          },
          {
            association: "Ref",
            attributes: ["nama"],
          },
        ],
        transaction: t,
      });
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: data.Pegawai.id,
        actor_nip: nip,
        actor_role: "SDM",
        action: `Tolak permohonan pembayaran (${data.Ref.nama})`,
        description: catatan,
        transaction: t,
      });
      await AlikaService.sendPushNotification({
        nip: data.Pegawai.nip,
        message:
          "Permohonan pembayaran telah di tolak oleh Bagian SDM. silahkan cek pada menu history untuk melihat detail penolakan",
      });
      successResponse(res, "Berhasil menolak permohonan", data);
    },
    {
      useTransaction: true,
    }
  ),
};
