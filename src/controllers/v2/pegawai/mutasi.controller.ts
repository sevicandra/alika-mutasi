import { PegawaiMutasi, sequelize, SpdCounter } from "@/models";
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
import { approveMutasiQueue } from "@/queues/ApproveMutasi.queue";
import { Logger } from "@/services/log.service";

export const getAllMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { nip } = req.user;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      nip: nip,
    };
    const skSearch: any = {
      status: {
        [Op.ne]: "DRAFT",
      },
    };
    if (search)
      skSearch[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];

    const data = await PegawaiMutasi.findAll({
      where,
      limit,
      offset,
      include: [
        {
          association: "SuratKeputusan",
          where: skSearch,
        },
        {
          association: "KantorAsal",
        },
        {
          association: "KantorTujuan",
        },
        {
          association: "Golongan",
        },
      ],
    });
    const count = await PegawaiMutasi.count({
      where,
      include: [
        {
          association: "SuratKeputusan",
          where: skSearch,
        },
        {
          association: "KantorAsal",
        },
        {
          association: "KantorTujuan",
        },
        {
          association: "Golongan",
        },
      ],
    });
    return successResponse(res, "data berhasil didapatkan", data, {
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

export const getMutasiById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { nip } = req.user;
    const { mutasiId } = req.params;
    const data = await PegawaiMutasi.findOne({
      where: {
        nip: nip,
        id: mutasiId,
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: {
              [Op.ne]: "DRAFT",
            },
          },
        },
        {
          association: "CurrentSanggah",
        },
      ],
    });
    if (!data) {
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

export const getTimeline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mutasiId } = req.params;
    const { nip } = req.user;

    const data = await PegawaiMutasi.findOne({
      where: {
        nip: nip,
        id: mutasiId,
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: {
              [Op.ne]: "DRAFT",
            },
          },
          include: [
            {
              association: "Timeline",
              order: [["tanggal", "ASC"]],
              include: [
                {
                  association: "Ref",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(
      res,
      "data berhasil didapatkan",
      data.SuratKeputusan,
      200
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

export const approve = async (req: AuthenticatedRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { nip } = req.user;
    const { mutasiId } = req.params;

    const [counter] = await SpdCounter.findOrCreate({
      where: { year: `${new Date().getFullYear()}` },
      defaults: {
        ext: "KN.122",
      },
      transaction: t,
    });

    counter.last_number += 1;
    await counter.save({ transaction: t });

    const data = await PegawaiMutasi.findOne({
      where: {
        id: mutasiId,
        nip: nip,
        status: "PENDING_APROVAL",
      },
      include: [
        {
          association: "TanggunganDewasa",
        },
        {
          association: "TanggunganInvant",
        },
        {
          association: "Art",
        },
        {
          association: "KantorAsal",
          include: [
            {
              association: "Kota",
            },
          ],
        },
        {
          association: "KantorTujuan",
          include: [
            {
              association: "Kota",
            },
          ],
        },
      ],
      transaction: t,
    });
    if (!data) {
      await t.rollback();
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    data.status = "CALCULATING";
    await data.save({ transaction: t });
    await approveMutasiQueue.add(
      "approve_mutasi",
      {
        nip: nip,
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
        pegawai_id: mutasiId,
        jumlah_tanggungan_dewasa: data.TanggunganDewasa.length,
        jumlah_tanggungan_invant: data.TanggunganInvant.length,
        tanggungan_art: data.Art ? true : false,
        asal: data.KantorAsal.Kota.kode,
        tujuan: data.KantorTujuan.Kota.kode,
        provinsi_tujuan: data.KantorTujuan.Kota.kode_provinsi,
        faktor_darat: data.faktor_darat,
        faktor_laut: data.faktor_laut,
        faktor_udara: data.faktor_udara,
        kelas_pesawat: data.kelas_pesawat,
        golongan: data.golongan.split("")[0] as "1" | "2" | "3" | "4",
        jumlah_hari: data.jumlah_hari,
      },
      {
        jobId: mutasiId,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    await Logger.GeneralAction({
      pegawai_id: mutasiId,
      actor_nip: nip,
      actor_role: "PEGAWAI",
      action: "Setujui Data Tanggungan Mutasi",
      description: null,
      transaction: t,
    });
    await t.commit();
    return successResponse(
      res,
      "data perhitungan biaya mutasi berhasil diproses",
      data,
      200
    );
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
