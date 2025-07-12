import { DokumenTermin, sequelize, TteDokumen } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
} from "sequelize";
import { Op } from "sequelize";
import { AxiosError } from "axios";
import { MinioService } from "@/services/minio.service";
import { EsignService } from "@/services/esign.service";
import QRCode from "qrcode";
import { appConfig } from "@/config/app.config";
import { UUID } from "@/utils/uuid.util";
import { Logger } from "@/services/log.service";
import { AlikaService } from "@/services/alika.service";

const minioService = new MinioService();

export const getAllDokumen = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { nip } = req.user;
    const { mutasiId, terminId } = req.params;
    const data = await DokumenTermin.findAll({
      where: {
        termin_id: terminId,
      },
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
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
      ],
    });
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const getDokumenById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { nip } = req.user;
    const { mutasiId, terminId, dokumenId } = req.params;
    const data = await DokumenTermin.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
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
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
      ],
    });
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const getDokumenFile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { nip, name } = req.user;
    const { mutasiId, terminId, dokumenId } = req.params;
    const data = await DokumenTermin.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
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
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
      ],
    });
    if (!data || !data.file) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const stream = await minioService.downloadFile(`${data.file}`);
    if (stream) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${data.document_type} - ${name}.pdf"`
        );
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    }
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const uploadDokumen = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  const file = req.file;
  try {
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];
    if (!file)
      ValidationError.push({
        field: "file",
        message: "File tidak boleh kosong",
      });

    if (ValidationError.length > 0) {
      return errorResponse(
        res,
        "Parameter tidak lengkap",
        ValidationError,
        422
      );
    }

    const dokumen = await DokumenTermin.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
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
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
              include: [
                {
                  association: "SuratKeputusan",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!dokumen) {
      return errorResponse(res, "Dokumen tidak ditemukan", null, 404);
    }
    if (dokumen.uploadable === false) {
      return errorResponse(res, "Dokumen tidak dapat diupload", null, 403);
    }

    if (dokumen.file) {
      await minioService.deleteFile(dokumen.file);
    }

    const fileName = UUID.v4();
    const filePath = `${dokumen.Termin.Pegawai.SuratKeputusan.nomor.replace(
      /\//g,
      "_"
    )}/${dokumen.Termin.Pegawai.nip}/${fileName}.pdf`;
    await minioService.uploadFile(file?.buffer, filePath);
    dokumen.file = filePath;
    await dokumen.save();
    return successResponse(res, "File berhasil diupload");
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const deleteDokumen = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  try {
    const dokumen = await DokumenTermin.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
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
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
      ],
    });

    if (!dokumen || !dokumen.file) {
      return errorResponse(res, "Dokumen tidak ditemukan", null, 404);
    }
    if (dokumen.uploadable === false) {
      return errorResponse(res, "Dokumen tidak dapat dihapus", null, 403);
    }

    await minioService.deleteFile(dokumen.file);
    dokumen.file = "";
    await dokumen.save();
    return successResponse(res, "File berhasil dihapus");
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const tteDokumen = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { nip, nik } = req.user;
    const { mutasiId, terminId, dokumenId } = req.params;
    const { passphrase } = req.body;
    const data = await DokumenTermin.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
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
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
        {
          association: "TtePegawai",
        },
      ],
      transaction: t,
    });
    if (!data || !data.file) {
      return errorResponse(res, "dokumen tidak ditemukan", null, 404);
    }
    if (data.process === "PROCESSING") {
      return errorResponse(
        res,
        `dokumen sedang diproses oleh ${data.processed_by}`,
        null,
        403
      );
    }
    data.process = "PROCESSING";
    data.processed_by = data.Termin.Pegawai.nama;
    data.save({ transaction: t });

    const stream = await minioService.downloadFile(data.file);
    if (!stream) throw new Error("File tidak ditemukan");

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const blob = new Blob([Buffer.concat(chunks)], { type: "application/pdf" });
    const TteBlob = await QRCode.toDataURL(
      `${appConfig.url}/public/file/download/pembayaran/${data.id}`,
      {
        type: "image/png",
        margin: 0,
      }
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
    minioService.uploadFile(tte.buffer, data.file);
    data.TtePegawai.date = new Date(tte.date || "");

    await data.TtePegawai.save({ transaction: t });
    data.process = "IDLE";
    data.processed_by = "";
    data.save({ transaction: t });
    await t.commit();
    return successResponse(res, "tte berhasil di proses");
  } catch (error: unknown) {
    t.rollback();
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const cekStatusSPD2 = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  try {
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
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "data berhasil didapatkan", {
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
  } catch (error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const setTtePejabatKantorAsal = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip, name } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  const { nama_pejabat, nip_pejabat } = await req.body;
  const t = await sequelize.transaction();
  try {
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
      transaction: t,
    });
    if (!data) {
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    data.nama = nama_pejabat;
    data.nip = nip_pejabat;
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: mutasiId,
      actor_nip: nip,
      actor_role: "PEGAWAI",
      action: "Permohonan tanda tangan SPD Lembar 2",
      description: `Permohoanan tanda tangan SPD Lembar 2 keberangkatan kepada ${nama_pejabat} / ${nip_pejabat}`,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      title: "Permohonan tanda tangan SPD Lembar 2",
      message: `${name} mengajukan permohonan tanda tangan SPD Lembar 2`,
      nip: nip_pejabat,
    });
    await t.commit();

    return successResponse(res, "data berhasil diupdate");
  } catch (error: unknown) {
    await t.rollback();
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const setTtePejabatKantorTujuan = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip, name } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  const { nama_pejabat, nip_pejabat } = req.body;
  const t = await sequelize.transaction();
  try {
    const datakeberangkatan = await TteDokumen.findOne({
      where: {
        dokumen_id: dokumenId,
        jabatan: "PEJABAT_KANTOR_ASAL",
        status: "SIGNED",
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
      transaction: t,
    });
    
    if (!datakeberangkatan) {
      t.rollback();
      return errorResponse(
        res,
        "data keberangkatan tidak ditemukan",
        null,
        404
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
                    nip: nip,
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
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    data.nama = nama_pejabat;
    data.nip = nip_pejabat;
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: mutasiId,
      actor_nip: nip,
      actor_role: "PEGAWAI",
      action: "Permohonan tanda tangan SPD Lembar 2",
      description: `Permohoanan tanda tangan SPD Lembar 2 kedatangan kepada ${nama_pejabat} / ${nip_pejabat}`,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      title: "Permohonan tanda tangan SPD Lembar 2",
      message: `${name} mengajukan permohonan tanda tangan SPD Lembar 2`,
      nip: nip_pejabat,
    });
    await t.commit();
    return successResponse(res, "data berhasil diupdate");
  } catch (error: unknown) {
    await t.rollback();
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const resetTtePejabatKantorAsal = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip, name } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  const t = await sequelize.transaction();
  try {
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
      transaction: t,
    });
    if (!data) {
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    const nip_pejabat = data.nip as string;
    data.nama = "";
    data.nip = null;
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: mutasiId,
      actor_nip: nip,
      actor_role: "PEGAWAI",
      action: "Permohonan tanda tangan SPD Lembar 2",
      description: `Permohoanan tanda tangan SPD Lembar 2 keberangkatan dibatalkan`,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      title: "Permohonan tanda tangan SPD Lembar 2",
      message: `${name} membatalkan permohonan tanda tangan SPD Lembar 2`,
      nip: nip_pejabat,
    });
    await t.commit();
    return successResponse(res, "data berhasil diupdate");
  } catch (error: unknown) {
    await t.rollback();
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};

export const resetTtePejabatKantorTujuan = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip, name } = req.user;
  const { mutasiId, terminId, dokumenId } = req.params;
  const t = await sequelize.transaction();
  try {
    const datakeberangkatan = await TteDokumen.findOne({
      where: {
        dokumen_id: dokumenId,
        jabatan: "PEJABAT_KANTOR_ASAL",
        status: "SIGNED",
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
      transaction: t,
    });

    if (!datakeberangkatan) {
      t.rollback();
      return errorResponse(
        res,
        "data keberangkatan tidak ditemukan",
        null,
        404
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
                    nip: nip,
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
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    const nip_pejabat = data.nip as string;
    data.nama = null;
    data.nip = null;
    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: mutasiId,
      actor_nip: nip,
      actor_role: "PEGAWAI",
      action: "Permohonan tanda tangan SPD Lembar 2",
      description: `Permohoanan tanda tangan SPD Lembar 2 kedatangan dibatalkan`,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      title: "Permohonan tanda tangan SPD Lembar 2",
      message: `${name} membatalkan permohonan tanda tangan SPD Lembar 2`,
      nip: nip_pejabat,
    });
    await t.commit();
    return successResponse(res, "data berhasil diupdate");
  } catch (error: unknown) {
    await t.rollback();
    if (
      error instanceof ValidationError ||
      error instanceof UniqueConstraintError
    ) {
      const parsedErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse(res, "Validation gagal", parsedErrors, 422);
    } else if (
      error instanceof DatabaseError ||
      error instanceof ConnectionError
    ) {
      const parsedErrors = error.message;
      return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
    } else if (error instanceof ConnectionError) {
      const parsedErrors = { message: "Gagal terhubung ke database" };
      return errorResponse(res, "Koneksi ke database gagal", parsedErrors, 503);
    } else if (error instanceof AxiosError) {
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as AxiosError).isAxiosError
      ) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status || 500;
        const message =
          (axiosError.response?.data as { message?: string })?.message ||
          axiosError.message ||
          "Kesalahan pada permintaan eksternal";
        const details = axiosError.response?.data || null;
        return errorResponse(res, message, details, statusCode);
      }
      return errorResponse(res, "Terjadi kesalahan", null, 500);
    } else if (error instanceof Error) {
      const parsedErrors = { message: error.message };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};
