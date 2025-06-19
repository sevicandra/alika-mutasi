import {
  Sanggah,
  DataSanggah,
  sequelize,
  PegawaiMutasi,
  TicketCounter,
} from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import { UUID } from "@/utils/uuid.util";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
} from "sequelize";
import { AxiosError } from "axios";
import { MinioService } from "@/services/minio.service";

const minioService = new MinioService();

function getYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYYMM
}

export const getRevisiKeluarga = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip } = req.user;
  const { mutasiId } = req.params;
  try {
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

export const getSanggah = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await Sanggah.findAll({
      include: [
        {
          association: "DataSanggah",
        },
      ],
      order: [["submitted_at", "DESC"]],
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

export const createSanggah = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { nip } = await req.user;
  const { mutasiId } = req.params;
  const { data } = await req.body;
  const files = req.files;
  const t = await sequelize.transaction();
  try {
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
    await t.commit();
    return successResponse(res, "data berhasil dibuat");
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
