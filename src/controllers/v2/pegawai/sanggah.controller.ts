import {
  Sanggah,
  DataSanggah,
  sequelize,
  PegawaiMutasi,
  TicketCounter,
} from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { UUID } from "@/utils/uuid.util";
import { MinioService } from "@/services/minio.service";
import { Logger } from "@/services/log.service";
import { PengajuanSanggah } from "@/types/pembayaranLog";
import { AlikaService } from "@/services/alika.service";

const minioService = new MinioService();

function getYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYYMM
}

export const getRevisiKeluarga = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
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
    const { mutasiId } = req.params;
    const data = await Sanggah.findOne({
      where: {
        pegawai_id: mutasiId,
        status: "DRAFT",
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            nip,
            id: mutasiId,
          },
        },
        {
          association: "DataSanggah",
        },
      ],
    });
    if (!data) {
      return successResponse(res, "data tidak ditemukan", null);
    }
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const createSanggah = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { nip } = await req.user;
    if (!nip) {
      await t.rollback();
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const { mutasiId } = req.params;
    const { data } = await req.body;
    const files = req.files;
    const mutasi = await PegawaiMutasi.findOne({
      where: {
        id: mutasiId,
        nip,
        status: "PENDING_APROVAL",
      },
      include: [
        {
          association: "SuratKeputusan",
        },
        {
          association: "CurrentSanggah",
        },
        { association: "Keluarga" },
      ],
      transaction: t,
    });

    if (!mutasi) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }

    if (mutasi.CurrentSanggah) {
      return errorResponse(
        res,
        "Pegawai sedang dalam proses sanggah",
        null,
        403
      );
    }

    const yearMonth = getYearMonth();

    const [counter] = await TicketCounter.findOrCreate({
      where: { year_month: yearMonth },
      transaction: t,
    });

    counter.last_number += 1;
    await counter.save({ transaction: t });

    const families = [];
    const logPayload: PengajuanSanggah[] = [];

    const sanggah = await Sanggah.create(
      {
        pegawai_id: mutasiId,
        ticket_number: `SGH-${yearMonth}-${String(counter.last_number).padStart(
          4,
          "0"
        )}`,
        status: "PENDING",
      },
      {
        transaction: t,
      }
    );

    const dokumenPendukung: {
      file: Buffer;
      nama: string;
    }[] = [];

    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      const action = item.action;
      const datas = item.data || undefined;
      const id = item.id || undefined;
      let file;
      const fileName = UUID.v4();
      const filePath = `${mutasi.SuratKeputusan.nomor.replace(/\//g, "_")}/${
        mutasi.nip
      }/${fileName}.pdf`;
      if (Array.isArray(files)) {
        file = files.find((f) => f.fieldname === `data[${index}][file]`);
        if (file) {
          dokumenPendukung.push({
            file: file.buffer,
            nama: filePath,
          });
        }
      }
      families.push({
        sanggah_id: sanggah.id,
        action,
        keluarga_id: id,
        file: file ? filePath : undefined,
        new_value: datas ? JSON.parse(datas) : undefined,
        reason: item.catatan,
      });
      logPayload.push({
        action: action.toUpperCase(),
        nama: mutasi.Keluarga.find((k) => k.id === id)?.nama || "",
        data: datas ? JSON.parse(datas) : undefined,
        catatan: item.catatan,
        file: file ? filePath : undefined,
        id: id ? id : undefined,
      });
    }
    await DataSanggah.bulkCreate(families, {
      transaction: t,
    });
    for (let index = 0; index < dokumenPendukung.length; index++) {
      const item = dokumenPendukung[index];
      await minioService.uploadFile(item.file, item.nama);
    }
    mutasi.status = "DISPUTED";
    await mutasi.save({ transaction: t });
    await Logger.SanggahanDiajukan({
      pegawai_id: mutasi.id,
      actor_nip: nip,
      action: "Pengajuan Sanggah Data Keluarga",
      description: null,
      payload: logPayload,
      transaction: t,
    });
    const userSDM = await AlikaService.getUserSDM();
    await AlikaService.sendBulkPushNotification({
      nip: userSDM.map((user) => user.nip),
      message: `${mutasi.nama} mengajukan sanggah data keluarga`,
      title: "Pengajuan Sanggahan Data Keluarga",
    });
    await t.commit();
    return successResponse(res, "data berhasil dibuat");
  } catch (error: unknown) {
    await t.rollback();
    next(error)
  }
};
