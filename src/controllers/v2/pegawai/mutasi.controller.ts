import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { Logger } from "@/services/log.service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { approveMutasiQueue } from "@/queues/ApproveMutasi.queue";
import { PegawaiMutasi, SpdCounter } from "@/repositories";

export const MutasiControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      nip: nip,
    };
    const skSearch: any = {
      status: {
        [Op.ne]: "DRAFT",
      },
    };
    if (search)
      skSearch[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];

    const { items: data, pagination } = await PegawaiMutasi.findAllWithPagination({
      where,
      limit,
      offset,
      include: [
        {
          association: "SuratKeputusan",
          where: skSearch,
        },
        {
          association: "KantorAsal",
        },
        {
          association: "KantorTujuan",
        },
        {
          association: "Golongan",
        },
      ],
    });
    successResponse(res, "data berhasil didapatkan", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId } = req.params;
    const data = await PegawaiMutasi.findOne({
      where: {
        nip: nip,
        id: mutasiId,
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
        {
          association: "CurrentSanggah",
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    successResponse(res, "data berhasil didapatkan", data);
  }),

  getTimeline: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId } = req.params;

    const data = await PegawaiMutasi.findOne({
      where: {
        nip: nip,
        id: mutasiId,
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: {
              [Op.ne]: "DRAFT",
            },
          },
          include: [
            {
              association: "Timeline",
              order: [["tanggal", "ASC"]],
              include: [
                {
                  association: "Ref",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    successResponse(res, "data berhasil didapatkan", data.SuratKeputusan);
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
      const { mutasiId } = req.params;

      if (typeof mutasiId != "string") {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const counter = await SpdCounter.getCounter(t);
      const data = await PegawaiMutasi.getDataPerhitungan(nip, mutasiId, t);
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      data.status = "CALCULATING";
      ((data.nomor_spd = `${String(counter.last_number).padStart(4, "0")}/${
        counter.ext
      }/${new Date().getFullYear()}`),
        (data.tanggal_spd = new Date()));
      await data.save({ transaction: t });
      await approveMutasiQueue.add(
        "approve_mutasi",
        {
          nip: nip,
          agenda: {
            nomor: `${String(counter.last_number).padStart(4, "0")}/${
              counter.ext
            }/${new Date().getFullYear()}`,
            tanggal: new Date().toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "2-digit",
            }),
          },
          pegawai_id: mutasiId,
          jumlah_tanggungan_dewasa: data.TanggunganDewasa.length,
          jumlah_tanggungan_invant: data.TanggunganInvant.length,
          tanggungan_art: data.Art ? true : false,
          asal: data.KantorAsal.Kota.kode,
          tujuan: data.KantorTujuan.Kota.kode,
          provinsi_tujuan: data.KantorTujuan.Kota.kode_provinsi,
          faktor_darat: data.faktor_darat,
          faktor_laut: data.faktor_laut,
          faktor_udara: data.faktor_udara,
          kelas_pesawat: data.kelas_pesawat,
          golongan: data.golongan.split("")[0] as "1" | "2" | "3" | "4",
          jumlah_hari: data.jumlah_hari,
        },
        {
          jobId: mutasiId,
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      await Logger.GeneralAction({
        pegawai_id: mutasiId,
        actor_nip: nip,
        actor_role: "PEGAWAI",
        action: "Setujui Data Tanggungan Mutasi",
        description: null,
        transaction: t,
      });

      successResponse(
        res,
        "data berhasil diproses, silakan menunggu perhitungan biaya selesai",
        data
      );
    },
    {
      useTransaction: true,
    }
  ),
};
