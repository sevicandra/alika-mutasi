import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { DokumenTermin, Termin } from "@/repositories";

export const PermohonanPembayaranController = {
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
          status: "WAITING_APPROVAL_KEU",
        }
      : { status: "WAITING_APPROVAL_KEU" };

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
    const { PermohonanId } = req.params;

    if (typeof PermohonanId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await Termin.findById(PermohonanId, {
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

      const { PermohonanId } = req.params;
      const { catatan } = await req.body;

      const data = await Termin.updateOne(
        {
          where: {
            id: PermohonanId,
            status: "WAITING_APPROVAL_KEU",
          },
        },
        {
          status: "APPROVED_KEU",
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

      await AlikaService.sendPushNotification({
        nip: data.Pegawai.nip,
        message:
          "Permohonan pembayaran telah disetujui oleh Bagian Keuangan dan akan segera diproses payroll",
      });
      await Logger.GeneralAction({
        pegawai_id: data.Pegawai.id,
        actor_nip: nip,
        actor_role: "KEU",
        action: `Setujui permohonan pembayaran (${data.Ref.nama})`,
        description: catatan ? catatan : null,
        transaction: t,
      });

      successResponse(res, "Berhasil menyetujui permohonan pembayaran");
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
      const { PermohonanId } = req.params;
      if (typeof PermohonanId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { catatan } = await req.body;

      const data = await Termin.updateOne(
        {
          where: {
            id: PermohonanId,
            status: "WAITING_APPROVAL_KEU",
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

      await AlikaService.sendPushNotification({
        nip: data.Pegawai.nip,
        message:
          "Permohonan pembayaran telah di tolak oleh Bagian Keuangan. silahkan cek pada menu history untuk melihat detail penolakan",
      });
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: data.Pegawai.id,
        actor_nip: nip,
        actor_role: "KEU",
        action: `Tolak permohonan pembayaran (${data.Ref.nama})`,
        description: catatan,
        transaction: t,
      });

      successResponse(res, "Berhasil menolak permohonan pembayaran");
    },
    {
      useTransaction: true,
    }
  ),

  getDokumenFile: asyncHandler(async (req: Request, res: Response) => {
    const { PermohonanId, DokumenId } = req.params;
    if (typeof PermohonanId != "string" || typeof DokumenId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await DokumenTermin.findOne({
      where: {
        termin_id: PermohonanId,
        id: DokumenId,
      },
    });
    if (!data || !data.file) {
      throw new NotFoundError("data tidak ditemukan");
    }

    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.document_type}.pdf`, "application/pdf");
  }),
};
