import { Termin, sequelize } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
export const getAllPermohonan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";

    const whereClause = search
      ? {
          [Op.or]: [
            where(col("Pegawai.nama"), { [Op.like]: `%${search}%` }),
            where(col("Pegawai.nip"), { [Op.like]: `%${search}%` }),
          ],
          status: "WAITING_APPROVAL_SDM",
        }
      : { status: "WAITING_APPROVAL_SDM" };

    const { rows: data, count } = await Termin.findAndCountAll({
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
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    return successResponse(res, "Berhasil mengambil data pegawai", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getPermohonanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { permohonanId } = req.params;
  try {
    const data = await Termin.findByPk(permohonanId, {
      include: [
        {
          association: "DokumenTermin",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data pegawai", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const setujuiPermohonan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { nip } = req.user;
  const { permohonanId } = req.params;
  const { catatan } = await req.body;
  const t = await sequelize.transaction();
  try {
    const data = await Termin.findOne({
      where: {
        id: permohonanId,
        status: "WAITING_APPROVAL_SDM",
      },
      include: [
        {
          association: "Pegawai",
        },
      ],
      transaction: t,
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    data.status = "WAITING_APPROVAL_KEU";
    await data.save({ transaction: t });
    await AlikaService.sendPushNotification({
      nip: data.Pegawai.nip,
      message:
        "Permohonan pembayaran telah disetujui oleh Bagian SDM dan diteruskan ke Bagian Keuangan",
    });
    await Logger.GeneralAction({
      pegawai_id: data.Pegawai.id,
      actor_nip: nip,
      actor_role: "SDM",
      action: "Setujui permohonan pembayaran",
      description: catatan ? catatan : null,
      transaction: t,
    });
    const userKeu = await AlikaService.getUserKeu();
    await AlikaService.sendBulkPushNotification({
      nip: userKeu.map((user) => user.nip),
      message: `pembayaran mutasi atas nama ${data.Pegawai.nama} telah disetujui oleh bagian SDM`,
      title: "Pengajuan Pembayaran Mutasi",
    });
    await t.commit();
    return successResponse(res, "Berhasil mengubah status permohonan", data);
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};

export const tolakPermohonan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { permohonanId } = req.params;
  const { nip } = req.user;
  const { catatan } = await req.body;
  const t = await sequelize.transaction();
  try {
    if (!catatan) {
      await t.rollback();
      return errorResponse(
        res,
        "Validation gagal",
        [
          {
            field: "catatan",
            message: "Catatan harus diisi",
          },
        ],
        422
      );
    }
    const data = await Termin.findOne({
      where: {
        id: permohonanId,
        status: "WAITING_APPROVAL_SDM",
      },
      include: [
        {
          association: "Pegawai",
        },
      ],
      transaction: t,
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    data.status = "REJECTED";
    await AlikaService.sendPushNotification({
      nip: data.Pegawai.nip,
      message:
        "Permohonan pembayaran telah di tolak oleh Bagian SDM. silahkan cek pada menu history untuk melihat detail penolakan",
    });
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: data.Pegawai.id,
      actor_nip: nip,
      actor_role: "SDM",
      action: "Tolak permohonan pembayaran",
      description: catatan,
      transaction: t,
    });
    await t.commit();
    return successResponse(res, "Berhasil mengubah status permohonan", data);
  } catch (error: unknown) {
    t.rollback();
    console.log(error);

    next(error);
  }
};
