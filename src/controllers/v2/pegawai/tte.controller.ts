import { TteDokumen, sequelize } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import e, { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
  Op,
} from "sequelize";
import { AxiosError } from "axios";
import { MinioService } from "@/services/minio.service";
import { EsignService } from "@/services/esign.service";
import QRCode from "qrcode";
import { appConfig } from "@/config/app.config";
import { generateQRCodeWithText } from "@/utils/qrcode.utils";
import { Logger } from "@/services/log.service";
import { AlikaService } from "@/services/alika.service";

const minioService = new MinioService();
export const getAllTte = async (req: AuthenticatedRequest, res: Response) => {
  const { nip } = req.user;
  const limit = parseInt(req.query.limit as string) || undefined;
  const offset = parseInt(req.query.offset as string) || undefined;
  try {
    const { rows: data, count } = await TteDokumen.findAndCountAll({
      where: {
        nip: nip,
        jabatan: {
          [Op.ne]: "PEGAWAI",
        },
        status: {
          [Op.or]: ["PENDING", "FAILED"],
        },
      },
      include: [
        {
          association: "Dokumen",
          where: {
            document_type: "SPD2",
          },
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
        jenis: d.Dokumen.document_type,
      };
    });

    return successResponse(res, "data berhasil didapatkan", mappedData, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
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

export const getTteById = async (req: AuthenticatedRequest, res: Response) => {
  const { nip } = req.user;
  const { id } = req.params;
  try {
    const data = await TteDokumen.findByPk(id);
    if (!data || data.nip !== nip) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
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

export const getFileTte = async (req: AuthenticatedRequest, res: Response) => {
  const { nip } = req.user;
  const { id } = req.params;
  try {
    const data = await TteDokumen.findByPk(id, {
      include: {
        association: "Dokumen",
      },
    });
    if (!data || data.nip !== nip) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const stream = await minioService.downloadFile(`${data.Dokumen.file}`);
    if (stream) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${data.Dokumen.document_type}.pdf"`
        );
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    } else {
      throw new Error("File tidak ditemukan");
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

export const processTte = async (req: AuthenticatedRequest, res: Response) => {
  const { nip, nik, name } = req.user;
  const { id } = req.params;
  const { passphrase, tanggal } = await req.body;
  const t = await sequelize.transaction();
  try {
    const data = await TteDokumen.findByPk(id, {
      include: [
        {
          association: "Dokumen",
          include: [
            {
              association: "Termin",
            },
          ],
        },
      ],
      transaction: t,
    });
    if (!data || data.nip !== nip || !data.Dokumen.file) {
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    data.Dokumen.process = "PROCESSING";
    data.Dokumen.processed_by = name;
    await data.Dokumen.save({ transaction: t });
    const stream = await minioService.downloadFile(data.Dokumen.file);
    if (!stream)
      throw new Error("File stream could not be downloaded from Minio.");

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    const blob = new Blob([fileBuffer], { type: "application/pdf" });

    const qrCodeUrl = `${appConfig.url}/public/file/download/pembayaran/${data.Dokumen.id}`;
    const TteBlob = await generateQRCodeWithText(
      qrCodeUrl,
      new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      name
    );
    const tte = await EsignService.processEsign({
      nik: nik,
      passphrase: passphrase,
      jenis: data.Dokumen.document_type,
      tujuan: "PPK Bagian SDM",
      perihal: "Dokumen Pembayaran Mutasi",
      blob: blob,
      fileName: data.Dokumen.file,
      page: data.koordinat_qr.page,
      xAxis: data.koordinat_qr.x + 100,
      yAxis: data.koordinat_qr.y + 100,
      width: data.koordinat_qr.x,
      height: data.koordinat_qr.y,
      imageTTD: await fetch(TteBlob).then((res) => res.blob()),
      imageTTDName: "qrcode.png",
    });
    await minioService.uploadFile(tte.buffer, data.Dokumen.file);
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
      action: "Tanda tangan dokumen SPD Lembar 2",
      description: null,
      transaction: t,
    });
    await t.commit();
    return successResponse(res, "berhasil di proses", data);
  } catch (error: unknown) {
    console.log(error);

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

export const tolakTte = async (req: AuthenticatedRequest, res: Response) => {
  const { nip, name } = req.user;
  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    const data = await TteDokumen.findByPk(id, {
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
      t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    data.nama = null;
    data.nip = null;

    await data.save({ transaction: t });
    await Logger.GeneralAction({
      pegawai_id: data.Dokumen.Termin.pegawai_id,
      actor_nip: nip,
      actor_role: data.jabatan,
      action: "Tolak SPD Lembar 2",
      description: null,
      transaction: t,
    });
    await AlikaService.sendPushNotification({
      nip: data.Dokumen.Termin.Pegawai.nip,
      title: "SPD Lembar 2",
      message: `Permohonan Tandatangan SPD Lembar 2 telah ditolak oleh ${name}`,
    });
    await t.commit();
    return successResponse(res, "berhasil di proses", data);
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
