import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { EsignService } from "@/services/esign.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { generateQRCode } from "@/utils/qrcode.utils";
import { appConfig } from "@/config/app.config";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { TteDokumen } from "@/repositories";

export const TteControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const whereClause: any = {
      nip: nip,
      jabatan: "BENDAHARA",
      status: {
        [Op.or]: ["PENDING", "FAILED"],
      },
    };

    if (search) {
      whereClause[Op.or] = [
        where(col("Dokumen.Termin.Pegawai.nama"), { [Op.like]: `%${search}%` }),
        where(col("Dokumen.Termin.Pegawai.nip"), { [Op.like]: `%${search}%` }),
      ];
    }
    const { items: data, pagination } = await TteDokumen.findAllWithPagination({
      where: whereClause,
      include: [
        {
          association: "Dokumen",
          include: [
            {
              association: "Termin",
              include: [
                {
                  association: "Pegawai",
                },
                {
                  association: "Ref",
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
    });

    const mappedData = data.map((d) => {
      return {
        id: d.id,
        role: d.jabatan,
        nip: d.Dokumen.Termin.Pegawai.nip,
        nama: d.Dokumen.Termin.Pegawai.nama,
        status: d.status,
        jenis: `${d.Dokumen.document_type} - ${d.Dokumen.Termin.Ref.nama}`,
      };
    });

    successResponse(res, "data berhasil didapatkan", mappedData, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }

    const { id } = req.params;

    if (typeof id != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const data = await TteDokumen.findOne({
      where: {
        id: id,
        nip: nip,
      },
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    successResponse(res, "data berhasil didapatkan", data);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { id } = req.params;

    if (typeof id != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const data = await TteDokumen.findOne({
      where: {
        id: id,
        nip: nip,
      },
      include: {
        association: "Dokumen",
      },
    });

    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    const stream = await minioService.getFile(`${data.Dokumen.file}`);
    fileResponse(res, stream, `${data.Dokumen.document_type}.pdf`, "application/pdf");
  }),

  process: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      const nik = req.user?.nik;
      const name = req.user?.name;

      if (!nip || !nik || !name) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }

      const { id } = req.params;
      if (typeof id != "string") {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const { passphrase } = await req.body;

      const data = await TteDokumen.findById(id, {
        include: [
          {
            association: "Dokumen",
            include: [
              {
                association: "Termin",
                include: [
                  {
                    association: "Pegawai",
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!data || data.nip !== nip || !data.Dokumen.file) {
        throw new NotFoundError("data tidak ditemukan");
      }
      data.Dokumen.process = "PROCESSING";
      data.Dokumen.processed_by = name;
      await data.Dokumen.save({ transaction: t });
      const stream = await minioService.getFile(data.Dokumen.file);
      if (!stream) throw new Error("File stream could not be downloaded from Minio.");
      const blob = new Blob([stream], { type: "application/pdf" });

      const qrCodeUrl = `${appConfig.URL}/public/file/download/pembayaran/${data.Dokumen.id}`;
      const TteBlob = await generateQRCode(qrCodeUrl);
      const tte = await EsignService.processEsign({
        nik: nik,
        passphrase: passphrase,
        jenis: data.Dokumen.document_type,
        tujuan: "",
        perihal: "Dokumen Pembayaran Mutasi",
        blob: blob,
        fileName: data.Dokumen.file,
        page: data.koordinat_qr.page,
        xAxis: data.koordinat_qr.x + 50,
        yAxis: data.koordinat_qr.y + 50,
        width: data.koordinat_qr.x,
        height: data.koordinat_qr.y,
        imageTTD: await fetch(TteBlob).then((res) => res.blob()),
        imageTTDName: "qrcode.png",
      });
      await minioService.uploadFile(tte.buffer, data.Dokumen.file, "application/pdf");
      data.Dokumen.process = "IDLE";
      data.Dokumen.processed_by = "";
      data.date = new Date(tte.date || "");
      data.status = "SIGNED";
      await data.Dokumen.save({ transaction: t });
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: data.Dokumen.Termin.pegawai_id,
        actor_nip: nip,
        actor_role: data.jabatan,
        action: `Tanda tangan dokumen ${data.Dokumen.document_type} oleh Bendahara`,
        description: null,
        transaction: t,
      });
      successResponse(res, "berhasil di proses", data);
    },
    {
      useTransaction: true,
    }
  ),
};
