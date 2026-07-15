import { Blob } from "buffer";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { EsignService } from "@/services/esign.service";
import { GenerateFileService } from "@/services/generateFile.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { generateQRCode } from "@/utils/qrcode.utils";
import { UUID } from "@/utils/uuid.util";
import { appConfig } from "@/config/app.config";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { DokumenTermin, PegawaiMutasi, RefTermin, SpdCounter, TteDokumen } from "@/repositories";

export const DokumenControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, terminId } = req.params;

    if (typeof mutasiId != "string" || typeof terminId != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const data = await DokumenTermin.getDokumenPegawai(mutasiId, terminId, nip);

    successResponse(res, "data berhasil didapatkan", data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, terminId, dokumenId } = req.params;

    if (
      typeof mutasiId != "string" ||
      typeof terminId != "string" ||
      typeof dokumenId != "string"
    ) {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const data = await DokumenTermin.getDokumenPegawaiById(mutasiId, terminId, dokumenId, nip);
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    successResponse(res, "data berhasil didapatkan", data);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    const name = req.user?.name;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, terminId, dokumenId } = req.params;

    if (
      typeof mutasiId != "string" ||
      typeof terminId != "string" ||
      typeof dokumenId != "string"
    ) {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const data = await DokumenTermin.getDokumenPegawaiById(mutasiId, terminId, dokumenId, nip);

    if (!data || !data.file) {
      throw new NotFoundError("data tidak ditemukan");
    }
    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.document_type} - ${name}.pdf`, "application/pdf");
  }),

  uploadFile: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }

      const { mutasiId, terminId, dokumenId } = req.params;

      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const file = req.file;
      if (!file) {
        throw new InvalidRequestError("File tidak ditemukan");
      }
      const data = await DokumenTermin.getDokumenPegawaiByIdWithSuratKeputusan(
        mutasiId,
        terminId,
        dokumenId,
        nip
      );
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      if (data.uploadable === false) {
        throw new AuthorizationError("Dokumen tidak dapat di ubah");
      }

      const fileName = UUID.v4();
      const filePath = `${data.Termin.Pegawai.SuratKeputusan.nomor.replace(
        /\//g,
        "_"
      )}/${data.Termin.Pegawai.nip}/${fileName}.pdf`;
      await minioService.uploadFile(file.buffer, filePath, "application/pdf");
      if (data.file) {
        await minioService.deleteFile(data.file);
      }
      data.file = filePath;
      await data.save({ transaction: t });
      successResponse(res, "File berhasil diupload");
    },
    {
      useTransaction: true,
    }
  ),

  resetFile: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }

      const { mutasiId, terminId, dokumenId } = req.params;

      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const data = await DokumenTermin.getDokumenPegawaiByIdWithSuratKeputusan(
        mutasiId,
        terminId,
        dokumenId,
        nip
      );
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      if (data.uploadable === false) {
        throw new AuthorizationError("Dokumen tidak dapat di ubah");
      }

      if (data.Termin.status !== "DRAFT" && data.Termin.status !== "REJECTED") {
        throw new AuthorizationError(`Status termin ${data.Termin.status}, tidak dapat di reset`);
      }
      const pegawai = await PegawaiMutasi.findOne({
        where: { id: mutasiId },
        include: [
          {
            association: "Termin",
            order: [["urutan", "DESC"]],
            include: [
              {
                association: "Ref",
              },
            ],
          },
          {
            association: "RincianBiaya",
          },
          {
            association: "KantorAsal",
            include: [{ association: "Kota" }],
          },
          {
            association: "KantorTujuan",
            include: [{ association: "Kota" }],
          },
          {
            association: "SuratKeputusan",
          },
          {
            association: "Golongan",
          },
          {
            association: "Keluarga",
            include: [
              {
                association: "Ref",
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!pegawai) {
        throw new Error("Pegawai not found");
      }
      const counter = await SpdCounter.getCounter(t);

      const refTermin = await RefTermin.findOne({
        where: {
          kode: data.Termin.ref_termin,
        },
      });

      if (!refTermin) {
        throw new AuthorizationError("Data termin tidak valid");
      }

      switch (data.document_type) {
        case "RINCIAN_BIAYA":
          const fileRincianBiaya = await GenerateFileService.RincianBiaya({
            pegawai: pegawai,
            termin: data.Termin,
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
            doc: refTermin.required_doc.find((doc) => doc.jenis === data.document_type)!,
          });
          data.file = fileRincianBiaya.file;
          await data.save({ transaction: t });
          break;

        case "SPD1":
          const fileSpd1 = await GenerateFileService.SPD1({
            pegawai: pegawai,
            termin: data.Termin,
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
            doc: refTermin.required_doc.find((doc) => doc.jenis === data.document_type)!,
          });
          data.file = fileSpd1.file;
          await data.save({ transaction: t });
          break;

        case "SPD2":
          const fileSpd2 = await GenerateFileService.SPD2({
            pegawai: pegawai,
            termin: data.Termin,
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
            doc: refTermin.required_doc.find((doc) => doc.jenis === data.document_type)!,
          });
          data.file = fileSpd2.file;
          await data.save({ transaction: t });
          break;

        default:
          throw new AuthorizationError(`Jenis dokumen tidak diizinkan untuk di reset`);
      }

      successResponse(res, "File berhasil diupload");
    },
    {
      useTransaction: true,
    }
  ),

  deleteFile: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, terminId, dokumenId } = req.params;
    if (
      typeof mutasiId != "string" ||
      typeof terminId != "string" ||
      typeof dokumenId != "string"
    ) {
      throw new InvalidRequestError("Parameter tidak valid");
    }
    const data = await DokumenTermin.getDokumenPegawaiById(mutasiId, terminId, dokumenId, nip);

    if (!data || !data.file) {
      throw new NotFoundError("data tidak ditemukan");
    }

    if (data.uploadable === false) {
      throw new AuthorizationError("File tidak dapat dihapus");
    }
    await minioService.deleteFile(data.file);

    data.file = null;
    await data.save();
    successResponse(res, "File berhasil dihapus");
  }),

  Tte: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      const nik = req.user?.nik;
      if (!nip || !nik) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId, terminId, dokumenId } = req.params;
      const { passphrase } = req.body;
      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const data = await DokumenTermin.getDokumenPegawaiByIdWithTTE(
        mutasiId,
        terminId,
        dokumenId,
        nip
      );

      if (!data || !data.file) {
        throw new NotFoundError("dokumen tidak ditemukan");
      }
      if (data.process === "PROCESSING") {
        throw new AuthorizationError(`dokumen sedang diproses oleh ${data.processed_by}`);
      }
      data.process = "PROCESSING";
      data.processed_by = data.Termin.Pegawai.nama;
      data.save({ transaction: t });
      const stream = await minioService.getFile(data.file);
      if (!stream) throw new Error("File tidak ditemukan");

      const blob = new Blob([stream], { type: "application/pdf" });

      const TteBlob = await generateQRCode(
        `${appConfig.URL}/public/file/download/pembayaran/${data.id}`
      );
      const tte = await EsignService.processEsign({
        nik: nik,
        passphrase: passphrase,
        jenis: data.document_type,
        tujuan: "PPK Bagian SDM",
        perihal: "Dokumen Mutasi",
        blob: blob,
        fileName: data.file,
        page: data.TtePegawai.koordinat_qr.page,
        xAxis: data.TtePegawai.koordinat_qr.x + 50,
        yAxis: data.TtePegawai.koordinat_qr.y + 50,
        width: data.TtePegawai.koordinat_qr.x,
        height: data.TtePegawai.koordinat_qr.y,
        imageTTD: await fetch(TteBlob)
          .then((res) => res.blob())
          .then((blob) => {
            return blob;
          }),
        imageTTDName: "qrcode.png",
      });
      minioService.uploadFile(tte.buffer, data.file, "application/pdf");
      data.TtePegawai.date = new Date(tte.date || "");

      await data.TtePegawai.save({ transaction: t });
      data.process = "IDLE";
      data.processed_by = "";
      data.save({ transaction: t });
      successResponse(res, "data berhasil ditandatangani", data);
    },
    {
      useTransaction: true,
    }
  ),

  getStatusSPD2: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { mutasiId, terminId, dokumenId } = req.params;
    if (
      typeof mutasiId != "string" ||
      typeof terminId != "string" ||
      typeof dokumenId != "string"
    ) {
      throw new InvalidRequestError("Parameter tidak valid");
    }

    const KantorAsal = await TteDokumen.findOne({
      where: {
        dokumen_id: dokumenId,
        jabatan: "PEJABAT_KANTOR_ASAL",
      },
      include: [
        {
          association: "Dokumen",
          where: { termin_id: terminId },
          include: [
            {
              association: "Termin",
              where: {
                pegawai_id: mutasiId,
              },
              include: [
                {
                  association: "Pegawai",
                  where: {
                    nip: nip,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    const KantorTujuan = await TteDokumen.findOne({
      where: {
        dokumen_id: dokumenId,
        jabatan: "PEJABAT_KANTOR_TUJUAN",
      },
      include: [
        {
          association: "Dokumen",
          where: { termin_id: terminId },
          include: [
            {
              association: "Termin",
              where: {
                pegawai_id: mutasiId,
              },
              include: [
                {
                  association: "Pegawai",
                  where: {
                    nip: nip,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    if (!KantorAsal || !KantorTujuan) {
      throw new NotFoundError("data tidak ditemukan");
    }
    successResponse(res, "data berhasil didapatkan", {
      KantorAsal: {
        penandatangan: KantorAsal.nama && KantorAsal.nip ? true : false,
        nama: KantorAsal.nama,
        nip: KantorAsal.nip,
        status: KantorAsal.status,
      },
      KantorTujuan: {
        penandatangan: KantorTujuan.nama && KantorTujuan.nip ? true : false,
        nama: KantorTujuan.nama,
        nip: KantorTujuan.nip,
        status: KantorTujuan.status,
      },
    });
  }),

  setPejabatKantorAsal: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nipUser = req.user?.nip;
      const nameUser = req.user?.name;
      if (!nipUser || !nameUser) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId, terminId, dokumenId } = req.params;
      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const { nama, nip } = await req.body;
      if (nipUser === nip) {
        throw new AuthorizationError("Dokumen hanya dapat ditandatangani oleh pejabat lain");
      }
      const data = await TteDokumen.findOne({
        where: {
          dokumen_id: dokumenId,
          jabatan: "PEJABAT_KANTOR_ASAL",
          status: {
            [Op.ne]: "SIGNED",
          },
          nama: {
            [Op.or]: ["", null],
          },
          nip: {
            [Op.or]: ["", null],
          },
        },
        include: [
          {
            association: "Dokumen",
            where: { termin_id: terminId, document_type: "SPD2" },
            include: [
              {
                association: "Termin",
                where: {
                  pegawai_id: mutasiId,
                },
                include: [
                  {
                    association: "Pegawai",
                    where: {
                      nip: nipUser,
                    },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      data.nama = nama;
      data.nip = nip;
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: mutasiId,
        actor_nip: nipUser,
        actor_role: "PEGAWAI",
        action: "Permohonan tanda tangan SPD Lembar 2",
        description: `Permohoanan tanda tangan SPD Lembar 2 keberangkatan kepada ${nama} / ${nip}`,
        transaction: t,
      });
      await AlikaService.sendPushNotification({
        title: "Permohonan tanda tangan SPD Lembar 2",
        message: `${nameUser} mengajukan permohonan tanda tangan SPD Lembar 2`,
        nip: nip,
      });
      successResponse(res, "data berhasil diupdate");
    },
    {
      useTransaction: true,
    }
  ),

  setPejabatKantorTujuan: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nipUser = req.user?.nip;
      const nameUser = req.user?.name;
      if (!nipUser || !nameUser) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId, terminId, dokumenId } = req.params;
      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const { nama, nip } = await req.body;
      if (nipUser === nip) {
        throw new AuthorizationError("Dokumen hanya dapat ditandatangani oleh pejabat lain");
      }
      const datakeberangkatan = await TteDokumen.findOne({
        where: {
          dokumen_id: dokumenId,
          jabatan: "PEJABAT_KANTOR_ASAL",
          status: "SIGNED",
        },
        include: [
          {
            association: "Dokumen",
            where: { termin_id: terminId, document_type: "SPD2" },
            include: [
              {
                association: "Termin",
                where: {
                  pegawai_id: mutasiId,
                },
                include: [
                  {
                    association: "Pegawai",
                    where: {
                      nip: nipUser,
                    },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });

      if (!datakeberangkatan) {
        throw new InvalidRequestError(
          "data keberangkatan tidak ditemukan, mohon periksa kembali status tandatangan SPD Lembar 2"
        );
      }
      const data = await TteDokumen.findOne({
        where: {
          dokumen_id: dokumenId,
          jabatan: "PEJABAT_KANTOR_TUJUAN",
          status: {
            [Op.ne]: "SIGNED",
          },
          nama: {
            [Op.or]: ["", null],
          },
          nip: {
            [Op.or]: ["", null],
          },
        },
        include: [
          {
            association: "Dokumen",
            where: { termin_id: terminId },
            include: [
              {
                association: "Termin",
                where: {
                  pegawai_id: mutasiId,
                },
                include: [
                  {
                    association: "Pegawai",
                    where: {
                      nip: nipUser,
                    },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      data.nama = nama;
      data.nip = nip;
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: mutasiId,
        actor_nip: nipUser,
        actor_role: "PEGAWAI",
        action: "Permohonan tanda tangan SPD Lembar 2",
        description: `Permohoanan tanda tangan SPD Lembar 2 kedatangan kepada ${nama} / ${nip}`,
        transaction: t,
      });
      await AlikaService.sendPushNotification({
        title: "Permohonan tanda tangan SPD Lembar 2",
        message: `${nameUser} mengajukan permohonan tanda tangan SPD Lembar 2`,
        nip: nip,
      });

      successResponse(res, "data berhasil diupdate");
    },
    {
      useTransaction: true,
    }
  ),

  removePejabatKantorAsal: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nipUser = req.user?.nip;
      const nameUser = req.user?.name;
      if (!nipUser || !nameUser) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId, terminId, dokumenId } = req.params;
      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const data = await TteDokumen.findOne({
        where: {
          dokumen_id: dokumenId,
          jabatan: "PEJABAT_KANTOR_ASAL",
          status: {
            [Op.ne]: "SIGNED",
          },
          nip: {
            [Op.or]: [
              {
                [Op.ne]: "",
              },
              {
                [Op.ne]: null,
              },
            ],
          },
          nama: {
            [Op.or]: [
              {
                [Op.ne]: "",
              },
              {
                [Op.ne]: null,
              },
            ],
          },
        },
        include: [
          {
            association: "Dokumen",
            where: { termin_id: terminId, document_type: "SPD2" },
            include: [
              {
                association: "Termin",
                where: {
                  pegawai_id: mutasiId,
                },
                include: [
                  {
                    association: "Pegawai",
                    where: {
                      nip: nipUser,
                    },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      const nip = data.nip as string;
      data.nama = "";
      data.nip = null;
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: mutasiId,
        actor_nip: nipUser,
        actor_role: "PEGAWAI",
        action: "Permohonan tanda tangan SPD Lembar 2",
        description: `Permohoanan tanda tangan SPD Lembar 2 keberangkatan dibatalkan`,
        transaction: t,
      });
      await AlikaService.sendPushNotification({
        title: "Permohonan tanda tangan SPD Lembar 2",
        message: `${nameUser} membatalkan permohonan tanda tangan SPD Lembar 2`,
        nip: nip,
      });
      successResponse(res, "data berhasil diupdate");
    },
    {
      useTransaction: true,
    }
  ),

  removePejabatKantorTujuan: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nipUser = req.user?.nip;
      const nameUser = req.user?.name;
      if (!nipUser || !nameUser) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId, terminId, dokumenId } = req.params;
      if (
        typeof mutasiId != "string" ||
        typeof terminId != "string" ||
        typeof dokumenId != "string"
      ) {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const datakeberangkatan = await TteDokumen.findOne({
        where: {
          dokumen_id: dokumenId,
          jabatan: "PEJABAT_KANTOR_ASAL",
          status: "SIGNED",
        },
        include: [
          {
            association: "Dokumen",
            where: { termin_id: terminId, document_type: "SPD2" },
            include: [
              {
                association: "Termin",
                where: {
                  pegawai_id: mutasiId,
                },
                include: [
                  {
                    association: "Pegawai",
                    where: {
                      nip: nipUser,
                    },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });

      if (!datakeberangkatan) {
        throw new InvalidRequestError(
          "data keberangkatan tidak ditemukan, mohon periksa kembali status tandatangan SPD Lembar 2"
        );
      }
      const data = await TteDokumen.findOne({
        where: {
          dokumen_id: dokumenId,
          jabatan: "PEJABAT_KANTOR_TUJUAN",
          status: {
            [Op.ne]: "SIGNED",
          },
          nip: {
            [Op.or]: [
              {
                [Op.ne]: "",
              },
              {
                [Op.ne]: null,
              },
            ],
          },
          nama: {
            [Op.or]: [
              {
                [Op.ne]: "",
              },
              {
                [Op.ne]: null,
              },
            ],
          },
        },
        include: [
          {
            association: "Dokumen",
            where: { termin_id: terminId },
            include: [
              {
                association: "Termin",
                where: {
                  pegawai_id: mutasiId,
                },
                include: [
                  {
                    association: "Pegawai",
                    where: {
                      nip: nipUser,
                    },
                  },
                ],
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!data) {
        throw new NotFoundError("data tidak ditemukan");
      }
      const nip = data.nip as string;
      data.nama = null;
      data.nip = null;
      await data.save({ transaction: t });
      await Logger.GeneralAction({
        pegawai_id: mutasiId,
        actor_nip: nipUser,
        actor_role: "PEGAWAI",
        action: "Permohonan tanda tangan SPD Lembar 2",
        description: `Permohoanan tanda tangan SPD Lembar 2 kedatangan dibatalkan`,
        transaction: t,
      });
      await AlikaService.sendPushNotification({
        title: "Permohonan tanda tangan SPD Lembar 2",
        message: `${nameUser} membatalkan permohonan tanda tangan SPD Lembar 2`,
        nip: nip,
      });
      successResponse(res, "data berhasil diupdate");
    },
    {
      useTransaction: true,
    }
  ),
};
