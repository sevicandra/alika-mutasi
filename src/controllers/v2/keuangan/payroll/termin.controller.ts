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
import sequelize from "@/config/db.config";
import { successResponse } from "@/helpers/respose.helper";
import { Rekening, Termin } from "@/repositories";

export const TerminController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const tahap = (req.query.tahap as string) || undefined;
    const status = (req.query.status as string) || undefined;

    const { SkId } = req.params;
    const whereClause: any = {
      status: {
        [Op.or]: ["APPROVED_KEU", "PAID"],
      },
    };
    if (search) {
      whereClause[Op.or] = [
        where(col("Pegawai.nama"), { [Op.like]: `%${search}%` }),
        where(col("Pegawai.nip"), { [Op.like]: `%${search}%` }),
      ];
    }
    if (tahap) {
      whereClause[Op.and] = [where(col("Payroll.tahap"), tahap)];
    }
    if (status) {
      whereClause.status = status;
    }

    const { items: data, pagination } = await Termin.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      attributes: [
        "id",
        "tahun",
        "nominal",
        "status",
        [sequelize.col("Ref.nama"), "nama"],
        [sequelize.col("Ref.urutan"), "urutan"],
      ],
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            sk_id: SkId,
          },
          include: [
            {
              association: "Rekening",
            },
          ],
        },
        {
          association: "Ref",
        },
        {
          association: "Payroll",
        },
      ],
    });

    successResponse(
      res,
      "Berhasil mendapatkan termin",
      data.map((d) => {
        return {
          id: d.id,
          tahun: d.tahun,
          nominal: d.nominal,
          status: d.status,
          nama: d.Ref.nama,
          urutan: d.Ref.urutan,
          pegawai: {
            nama: d.Pegawai.nama,
            nip: d.Pegawai.nip,
          },
          rekening: {
            nama: d.Pegawai.Rekening?.nama_rekening,
            bank: d.Pegawai.Rekening?.nama_bank,
            nomor: d.Pegawai.Rekening?.nomor_rekening,
          },
          payroll: {
            tanggal: d.Payroll?.tanggal || null,
            tahap: d.Payroll?.tahap || "-",
          },
        };
      }),
      pagination
    );
  }),
  tolak: asyncHandler(async (req: Request, res: Response) => {
    const t = req.transaction;
    if (!t) {
      throw new InternalServerError("Transaction not found");
    }
    const nip = req.user?.nip;

    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }

    const { SkId, TerminId } = req.params;
    if (typeof TerminId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const {
      catatan,
    }: {
      catatan: string;
    } = req.body;

    const whereClause = {
      id: TerminId,
      status: {
        [Op.or]: ["APPROVED_KEU", "PAID"],
      },
      [Op.and]: [where(col("Pegawai.sk_id"), SkId)],
    };

    const data = await Termin.findOne({
      where: whereClause,
      include: [{ association: "Pegawai" }, { association: "Payroll" }, { association: "Ref" }],
    });
    if (!data) {
      throw new NotFoundError("Termin tidak ditemukan");
    }
    if (data.status !== "APPROVED_KEU" && data.status !== "PAID") {
      throw new AuthorizationError("Termin tidak dalam status draft");
    }
    data.status = "WAITING_APPROVAL_KEU";
    await data.Payroll?.destroy({ transaction: t });
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: data.Pegawai.id,
      actor_nip: nip,
      actor_role: "Keuangan",
      action: `Tolak Payroll (${data.Ref.nama})`,
      description: `Proses Payroll di tolak oleh Keuangan dengan catatan: ${catatan}`,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      nip: data.Pegawai.nip,
      message: `${catatan}`,
      title: "Payroll Mutasi Ditolak",
    });
    successResponse(res, "Berhasil tolak payroll", null);
  },{
    useTransaction: true,
  
  }),
  getRekening: asyncHandler(async (req: Request, res: Response) => {
    const { SkId, TerminId } = req.params;
    if (typeof TerminId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Rekening.findOne({
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "sk_id"],
          where: {
            sk_id: SkId,
          },
          include: [
            {
              association: "Termin",
              attributes: [],
              where: {
                id: TerminId,
                status: "APPROVED_KEU",
              },
            },
          ],
        },
      ],
    });
    successResponse(res, "Berhasil mengambil data rekening", data);
  }),
  updateRekening: asyncHandler(async (req: Request, res: Response) => {
    const t = req.transaction;
    if (!t) {
      throw new InternalServerError("Transaction not found");
    }
    const { SkId, TerminId } = req.params;
    if (typeof TerminId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const { nama_rekening, nama_bank, nomor_rekening } = req.body;
    const whereClause = {
      id: TerminId,
      status: "APPROVED_KEU",
      [Op.and]: [
        where(col("Pegawai.sk_id"), SkId),
      ],
    };
    const data = await Termin.findOne({
      where: whereClause,
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          include: [
            {
              association: "Termin",
              attributes: [],
            },
          ],
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("Termin tidak ditemukan");
    }

    if (data.status === "PAID") {
      throw new AuthorizationError("Payroll telah di prosess");
    }

    await Rekening.CreateOrUpdate(
      {
        pegawai_id: data.Pegawai.id,
        nama_rekening,
        nama_bank,
        nomor_rekening,
      },
      t
    );

    successResponse(res, "Berhasil memperbarui rekening", null);
  },{
    useTransaction: true,
  
  }),
};
