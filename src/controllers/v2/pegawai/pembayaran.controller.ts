import { Termin, sequelize } from "@/models";
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
import { EsignService } from "@/services/esign.service";
import { MinioService } from "@/services/minio.service";
import { appConfig } from "@/config/app.config";
import QRCode from "qrcode";
import { Logger } from "@/services/log.service";

const minioService = new MinioService();

export const getAllTermin = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { mutasiId } = req.params;
    const { nip } = req.user;

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

export const getTerminById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { nip } = req.user;
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

export const kirimTermin = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { nip, nik, nama } = req.user;
    const { mutasiId, terminId } = req.params;
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
      action: "Kirim Dokumen Permohonan Pembayaran Mutasi",
      description: null,
      transaction: t,
    });
    await t.commit();
    return successResponse(res, "Termin berhasil di proses");
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
      return errorResponse(res, error.message, null, 500);
    } else {
      const parsedErrors = { message: "Kesalahan tidak diketahui" };
      return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
    }
  }
};
