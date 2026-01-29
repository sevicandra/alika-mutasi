import { Request, Response } from "express";
import QRCode from "qrcode";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { EsignService } from "@/services/esign.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { appConfig } from "@/config/app.config";
import { successResponse } from "@/helpers/respose.helper";
import { Termin } from "@/repositories";

export const PembayaranControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId } = req.params;
    if (typeof mutasiId != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
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
    successResponse(res, "data berhasil didapatkan", data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, terminId } = req.params;
    if (typeof mutasiId != "string" || typeof terminId != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
    }
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
        {
          association: "Ref",
          attributes: ["nama"],
        },
      ],
    });

    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    successResponse(res, "data berhasil didapatkan", data);
  }),

  kirim: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      const name = req.user?.name;
      const nik = req.user?.nik;
      if (!nip || !nik || !name) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId, terminId } = req.params;
      if (typeof mutasiId != "string" || typeof terminId != "string") {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const { passphrase } = await req.body;
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
        throw new NotFoundError("Termin tidak ditemukan");
      }

      data.status = "PENDING";
      await data.save({ transaction: t });

      if (data.DokumenTermin.filter((doc) => doc.required === true && !doc.file).length > 0) {
        throw new InvalidRequestError("Dokumen belum lengkap");
      }
      const spd2 = data.DokumenTermin.find((doc) => doc.document_type === "SPD2");
      if (spd2) {
        for (const tte of spd2.Tte.filter((t) => t.jabatan !== "PPK")) {
          if (tte.status !== "SIGNED") {
            throw new InvalidRequestError(
              "Dokumen SPD Lembar 2 belum ditandatangani pejabat kantor asal/tujuan"
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
        doc.processed_by = name;
        await doc.save({ transaction: t });

        const stream = await minioService.getFile(doc.file);
        if (!stream) throw new Error("File stream could not be downloaded from Minio.");

        const blob = new Blob([stream], { type: "application/pdf" });

        const qrCodeUrl = `${appConfig.URL}/public/file/download/pembayaran/${doc.id}`;
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
        await minioService.uploadFile(tte.buffer, doc.file, "application/pdf");

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

      successResponse(res, "data berhasil dikirim");
    },
    {
      useTransaction: true,
    }
  ),
};
