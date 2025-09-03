import { Termin, sequelize } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { EsignService } from "@/services/esign.service";
import { MinioService } from "@/services/minio.service";
import { appConfig } from "@/config/app.config";
import QRCode from "qrcode";
import { Logger } from "@/services/log.service";
import { AlikaService } from "@/services/alika.service";

const minioService = new MinioService();

export const getAllTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mutasiId } = req.params;
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }

    const data = await Termin.findAll({
      where: {
        pegawai_id: mutasiId,
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            nip,
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
        {
          association: "Ref",
        },
      ],
      order: [["Ref", "urutan", "ASC"]],
    });

    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const getTerminById = async (
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
    const { mutasiId, terminId } = req.params;
    const data = await Termin.findOne({
      where: {
        id: terminId,
        pegawai_id: mutasiId,
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            nip,
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
        {
          association: "DokumenTermin",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }

    return successResponse(res, "Data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const kirimTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { nip, nik, nama } = req.user;
    const inputValidation: {
      field: string;
      message: string;
    }[] = [];
    if (!nip) {
      await t.rollback();
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const { mutasiId, terminId } = req.params;
    const { passphrase, confirmation } = await req.body;
    if (!passphrase)
      inputValidation.push({
        field: "passphrase",
        message: "passphrase tidak boleh kosong",
      });
    if (!confirmation || confirmation !== true)
      inputValidation.push({
        field: "confirmation",
        message: "mohon centang untuk melanjutkan",
      });
      if (inputValidation.length > 0) {
        await t.rollback();
        return errorResponse(res, "Parameter tidak lengkap", inputValidation, 422);
      }
    const data = await Termin.findOne({
      where: {
        id: terminId,
        pegawai_id: mutasiId,
        status: {
          [Op.or]: ["DRAFT", "REJECTED"],
        },
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            nip,
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
        {
          association: "DokumenTermin",
          include: [
            {
              association: "Tte",
            },
          ],
        },
        {
          association: "Ref",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }

    data.status = "PENDING";
    await data.save({ transaction: t });

    if (
      data.DokumenTermin.filter((doc) => doc.required === true && !doc.file)
        .length > 0
    ) {
      await t.rollback();
      return errorResponse(
        res,
        "dokumen belum lengkap mohon upload seluruh dokumen yg dibutuhkan",
        null,
        400
      );
    }
    const spd2 = data.DokumenTermin.find((doc) => doc.document_type === "SPD2");
    if (spd2) {
      for (const tte of spd2.Tte.filter((t) => t.jabatan !== "PPK")) {
        if (tte.status !== "SIGNED") {
          await t.rollback();
          return errorResponse(
            res,
            "Dokumen SPD Lembar 2 belum ditandatangani pejabat kantor asal/tujuan",
            null,
            400
          );
        }
      }
    }

    for (const doc of data.DokumenTermin.filter(
      (doc) => doc.file && doc.Tte.find((t) => t.jabatan === "PEGAWAI")
    )) {
      const tteMeta = doc.Tte.find((t) => t.jabatan === "PEGAWAI");
      if (!doc.file || !tteMeta) {
        throw new Error("Dokumen not found or file is missing.");
      }

      doc.process = "PROCESSING";
      doc.processed_by = nama;
      await doc.save({ transaction: t });

      const stream = await minioService.downloadFile(doc.file);
      if (!stream)
        throw new Error("File stream could not be downloaded from Minio.");

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      const blob = new Blob([fileBuffer], { type: "application/pdf" });

      const qrCodeUrl = `${appConfig.url}/public/file/download/pembayaran/${doc.id}`;
      const TteBlob = await QRCode.toDataURL(qrCodeUrl, {
        type: "image/png",
        margin: 0,
      });
      const tte = await EsignService.processEsign({
        nik: nik,
        passphrase: passphrase,
        jenis: doc.document_type,
        tujuan: "PPK Bagian SDM",
        perihal: "Dokumen Pembayaran Mutasi",
        blob: blob,
        fileName: doc.file,
        page: tteMeta.koordinat_qr.page,
        xAxis: tteMeta.koordinat_qr.x + 50,
        yAxis: tteMeta.koordinat_qr.y + 50,
        width: tteMeta.koordinat_qr.x,
        height: tteMeta.koordinat_qr.y,
        imageTTD: await fetch(TteBlob).then((res) => res.blob()),
        imageTTDName: "qrcode.png",
      });
      await minioService.uploadFile(tte.buffer, doc.file);

      doc.process = "IDLE";
      doc.processed_by = "";
      tteMeta.date = new Date(tte.date || "");
      tteMeta.status = "SIGNED";
      await doc.save({ transaction: t });
      await tteMeta.save({ transaction: t });
    }
    data.status = "WAITING_APPROVAL_SDM";
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: mutasiId,
      actor_nip: nip,
      actor_role: "PEGAWAI",
      action: `Kirim Dokumen Permohonan Pembayaran Mutasi (${data.Ref.nama})`,
      description: null,
      transaction: t,
    });
    const userSDM = await AlikaService.getUserSDM();
    await AlikaService.sendBulkPushNotification({
      nip: userSDM.map((user) => user.nip),
      message: `${data.Pegawai.nama} mengajukan pembayaran mutasi`,
      title: "Pengajuan Pembayaran Mutasi",
    });
    await t.commit();
    return successResponse(res, "Termin berhasil di proses");
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};
