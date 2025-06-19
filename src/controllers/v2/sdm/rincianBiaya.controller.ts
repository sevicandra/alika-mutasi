import { RincianBiaya, PegawaiMutasi } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
} from "sequelize";
import { AxiosError } from "axios";
import sequelize from "@/config/db.config";

export const getAllRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const where: any = {};
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const rincianBiaya = await RincianBiaya.findAll({
      where,
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["id", "nomor", "tanggal"],
              where: {
                id: SkId,
              },
            },
          ],
        },
      ],
      order: [
        ["jenis", "ASC"],
        ["urutan", "ASC"],
      ],
    });
    return successResponse(
      res,
      "Berhasil mendapatkan rincian biaya",
      rincianBiaya
    );
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

export const getRincianBiayaById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId, RincianBiayaId } = req.params;
    const rincianBiaya = await RincianBiaya.findByPk(RincianBiayaId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["id", "nomor", "tanggal"],
              where: {
                id: SkId,
              },
            },
          ],
        },
      ],
    });
    if (!rincianBiaya) {
      return errorResponse(res, "Rincian biaya tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mendapatkan rincian biaya",
      rincianBiaya
    );
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

export const createRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];
    const { PegawaiId, SkId } = req.params;
    const { jenis, sub_jenis, keterangan, volume, harga_satuan, urutan } =
      req.body;

    if (!jenis)
      ValidationError.push({ field: "jenis", message: "jenis harus diisi" });
    if (!sub_jenis)
      ValidationError.push({
        field: "sub_jenis",
        message: "Sub Jenis harus diisi",
      });
    if (!keterangan)
      ValidationError.push({
        field: "keterangan",
        message: "Keterangan harus diisi",
      });
    if (!volume)
      ValidationError.push({ field: "volume", message: "volume harus diisi" });
    if (!harga_satuan)
      ValidationError.push({
        field: "harga_satuan",
        message: "Harga Satuan harus diisi",
      });
    if (ValidationError.length > 0)
      return errorResponse(res, "Data tidak lengkap", ValidationError, 422);

    const pegawai = await PegawaiMutasi.findByPk(PegawaiId, {
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal", "status"],
          where: {
            id: SkId,
          },
        },
      ],
    });

    if (!pegawai) {
      return errorResponse(res, "Pegawai tidak ditemukan", null, 404);
    }

    if (
      pegawai.process_termin !== "IDLE" ||
      pegawai.SuratKeputusan.status !== "DRAFT"
    ) {
      return errorResponse(res, "sudah dilakukan proses termin", null, 409);
    }
    const rincianBiaya = await RincianBiaya.create({
      pegawai_id: PegawaiId,
      jenis,
      sub_jenis,
      keterangan,
      volume,
      harga_satuan,
      urutan,
    });
    if (!rincianBiaya) {
      return errorResponse(res, "Gagal membuat rincian biaya", null, 500);
    }

    return successResponse(res, "Berhasil membuat rincian biaya", rincianBiaya);
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

export const updateRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId, RincianBiayaId } = req.params;
    const { jenis, sub_jenis, keterangan, volume, harga_satuan, urutan } =
      req.body;
    const data = await RincianBiaya.findByPk(RincianBiayaId, {
      include: {
        association: "Pegawai",
        attributes: ["id", "nama", "nip"],
        where: {
          id: PegawaiId,
          process_termin: "IDLE",
        },
        include: [
          {
            association: "SuratKeputusan",
            attributes: ["id", "nomor", "tanggal"],
            where: {
              id: SkId,
              status: "DRAFT",
            },
          },
        ],
      },
    });
    if (!data) {
      return errorResponse(
        res,
        "perubahan data tidak dapat di proses",
        null,
        409
      );
    }
    if (jenis) data.jenis = jenis;
    if (sub_jenis) data.sub_jenis = sub_jenis;
    if (keterangan) data.keterangan = keterangan;
    if (volume) data.volume = volume;
    if (harga_satuan) data.harga_satuan = harga_satuan;
    if (urutan) data.urutan = urutan;
    await data.save();
    return successResponse(res, "Berhasil memperbarui rincian biaya", data);
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

export const deleteRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId, RincianBiayaId } = req.params;

    const data = await RincianBiaya.findByPk(RincianBiayaId, {
      include: {
        association: "Pegawai",
        attributes: ["id", "nama", "nip"],
        where: {
          id: PegawaiId,
          process_termin: "IDLE",
        },
        include: [
          {
            association: "SuratKeputusan",
            attributes: ["id", "nomor", "tanggal"],
            where: {
              id: SkId,
              status: "DRAFT",
            },
          },
        ],
      },
    });
    if (!data) {
      return errorResponse(res, "hapus data tidak dapat di proses", null, 409);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus rincian biaya", {
      id: RincianBiayaId,
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

export const resetRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const t = await sequelize.transaction();
  try {
    const { PegawaiId, SkId } = req.params;

    const data = await PegawaiMutasi.findOne({
      where: {
        id: PegawaiId,
        process_termin: "IDLE",
      },
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal"],
          where: {
            id: SkId,
            status: "DRAFT",
          },
        },
      ],
    });

    if (!data) {
      return errorResponse(res, "reset data tidak dapat di proses", null, 409);
    }

    await RincianBiaya.destroy({
      where: {
        pegawai_id: PegawaiId,
      },
      transaction: t,
    });

    data.process_biaya = "IDLE";
    await data.save({ transaction: t });

    await t.commit();
    return successResponse(res, "Berhasil reset rincian biaya", null);
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
