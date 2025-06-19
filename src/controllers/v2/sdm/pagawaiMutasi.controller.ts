import {
  PegawaiMutasi,
  Keluarga,
  RincianBiaya,
  SuratKeputusan,
  Termin,
} from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response } from "express";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
  Op,
} from "sequelize";
import { AxiosError } from "axios";
import { parse } from "csv-parse";
import sequelize from "@/config/db.config";
import { hitungBiayaJobService } from "@/services/hitungBiaya.service";

export const getAllPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { SkId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga =
      (req.query.process_keluarga as string) || undefined;
    const process_biaya = (req.query.process_biaya as string) || undefined;
    const process_termin = (req.query.process_termin as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {
      sk_id: SkId,
    };
    if (kantor_asal) where.kantor_asal = kantor_asal;
    if (kantor_tujuan) where.kantor_tujuan = kantor_tujuan;
    if (nip) where.nip = nip;
    if (status) where.status = status;
    if (process_keluarga) where.process_keluarga = process_keluarga;
    if (process_biaya) where.process_biaya = process_biaya;
    if (process_termin) where.process_termin = process_termin;
    if (search)
      where[Op.or] = [
        {
          nama: { [Op.like]: `%${search}%` },
        },
        {
          nip: { [Op.like]: `%${search}%` },
        },
      ];
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const include: any[] = [];
    if (associations) {
      const associationsArray = associations.split(",");
      for (const association of associationsArray) {
        include.push({
          association: association,
        });
      }
    }
    const data = await PegawaiMutasi.findAll({
      where,
      limit,
      offset,
      order,
      include,
    });
    const count = await PegawaiMutasi.count({ where });

    return successResponse(
      res,
      "Berhasil mengambil data pegawai mutasi",
      data,
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
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

export const countAllPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { SkId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga =
      (req.query.process_keluarga as string) || undefined;
    const process_biaya = (req.query.process_biaya as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {
      sk_id: SkId,
    };
    if (kantor_asal) where.kantor_asal = kantor_asal;
    if (kantor_tujuan) where.kantor_tujuan = kantor_tujuan;
    if (nip) where.nip = nip;
    if (status) where.status = status;
    if (process_keluarga) where.process_keluarga = process_keluarga;
    if (process_biaya) where.process_biaya = process_biaya;
    if (search)
      where[Op.or] = [
        {
          nama: { [Op.like]: `%${search}%` },
        },
        {
          nip: { [Op.like]: `%${search}%` },
        },
      ];
    const count = await PegawaiMutasi.count({ where });
    return successResponse(
      res,
      "Berhasil menghitung data pegawai mutasi",
      count
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

export const getPegawaiMutasiById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const data = await PegawaiMutasi.findByPk(PegawaiId, {
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal", "status"],
          where: {
            id: SkId,
          },
        },
        {
          association: "MonitoringTagihan",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    return successResponse(res, "Berhasil mengambil data pegawai mutasi", data);
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

export const createPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];
    const { SkId } = req.params;
    const { golongan, kantor_asal, kantor_tujuan, nip, nama } = req.body;
    if (!SkId)
      ValidationError.push({ field: "sk_id", message: "sk_id wajib diisi" });
    if (!golongan)
      ValidationError.push({
        field: "golongan",
        message: "golongan wajib diisi",
      });
    if (!kantor_asal)
      ValidationError.push({
        field: "kantor_asal",
        message: "kantor_asal wajib diisi",
      });
    if (!kantor_tujuan)
      ValidationError.push({
        field: "kantor_tujuan",
        message: "kantor_tujuan wajib diisi",
      });
    if (!nip)
      ValidationError.push({ field: "nip", message: "nip wajib diisi" });
    if (!nama)
      ValidationError.push({ field: "nama", message: "nama wajib diisi" });

    if (ValidationError.length > 0) {
      return errorResponse(
        res,
        "Parameter tidak lengkap",
        ValidationError,
        422
      );
    }

    const sk = await SuratKeputusan.findByPk(SkId);
    if (!sk || sk.status !== "DRAFT") {
      return errorResponse(res, "data tidak dapat di proses", null, 409);
    }

    const data = await PegawaiMutasi.create({
      sk_id: SkId,
      golongan: golongan,
      kantor_asal: kantor_asal,
      kantor_tujuan: kantor_tujuan,
      nip: nip,
      nama: nama,
    });
    return successResponse(res, "Berhasil membuat data pegawai mutasi", data);
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

export const importCsvPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];

    const {
      file,
      params: { SkId },
    } = req;

    if (!file) {
      ValidationError.push({
        field: "file",
        message: "file wajib diisi",
      });
    }

    if (ValidationError.length > 0) {
      return errorResponse(
        res,
        "Parameter tidak lengkap",
        ValidationError,
        422
      );
    }

    if (!file) {
      return errorResponse(res, "file wajib diisi", null, 400);
    }

    const sk = await SuratKeputusan.findByPk(SkId);
    if (!sk || sk.status !== "DRAFT") {
      return errorResponse(res, "data tidak dapat di proses", null, 409);
    }
    const csvBuffer = file.buffer;
    const records: PegawaiMutasi[] = [];
    const parser = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ";",
    });
    for await (const record of parser) {
      records.push({ ...record, sk_id: SkId || record.sk_id });
    }
    const invalid = records.find(
      (r) =>
        !r.nip || !r.nama || !r.kantor_asal || !r.kantor_tujuan || !r.golongan
    );
    if (invalid) {
      return errorResponse(res, "Data tidak valid", invalid, 400);
    }
    await PegawaiMutasi.bulkCreate(records);
    return successResponse(
      res,
      "Berhasil membuat data pegawai mutasi",
      null,
      201
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

export const updatePegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const { golongan, kantor_asal, kantor_tujuan, nip, nama } = req.body;

    const data = await PegawaiMutasi.findOne({
      where: {
        id: PegawaiId,
        status: "DRAFT",
        process_keluarga: "IDLE",
      },
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
    if (!data || data.process_keluarga !== "IDLE" || data.status !== "DRAFT") {
      return errorResponse(
        res,
        "perubah data tidak dapat dilakukan",
        null,
        409
      );
    }
    if (golongan) data.golongan = golongan;
    if (kantor_asal) data.kantor_asal = kantor_asal;
    if (kantor_tujuan) data.kantor_tujuan = kantor_tujuan;
    if (nip) data.nip = nip;
    if (nama) data.nama = nama;
    await data.save();
    return successResponse(
      res,
      "Berhasil memperbarui data pegawai mutasi",
      data
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

export const deletePegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const data = await PegawaiMutasi.findOne({
      where: {
        id: PegawaiId,
      },
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal", "status"],
          where: {
            id: SkId,
            status: "DRAFT",
          },
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "perubah data tidak ditemukan", null, 409);
    }

    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Data pegawai mutasi tidak dapat dihapus",
        null,
        403
      );
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data pegawai mutasi", {
      PegawaiId,
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

export const resetDataPegawaiMutasi = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const t = await sequelize.transaction();
  try {
    const { PegawaiId, SkId } = req.params;

    const data = await PegawaiMutasi.findByPk(PegawaiId, {
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal", "status"],
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
    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Proses keluarga pegawai mutasi tidak dapat direset",
        null,
        403
      );
    }

    data.process_keluarga = "IDLE";
    data.process_biaya = "IDLE";
    data.process_termin = "IDLE";
    await Keluarga.destroy({
      where: { pegawai_id: data.id },
      transaction: t,
    });
    await RincianBiaya.destroy({
      where: { pegawai_id: data.id },
      transaction: t,
    });
    await Termin.destroy({
      where: { pegawai_id: data.id },
      transaction: t,
    });

    await data.save({ transaction: t });
    await t.commit();
    return successResponse(
      res,
      "Berhasil mereset proses keluarga pegawai mutasi",
      data
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

export const hitungRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const data = await PegawaiMutasi.findOne({
      where: {
        id: PegawaiId,
        status: "DRAFT",
        process_keluarga: "DONE",
        process_termin: "IDLE",
      },
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

    if (!data) {
      return errorResponse(
        res,
        "Hitung rincian biaya tidak dapat di proses",
        null,
        404
      );
    }

    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Proses biaya pegawai mutasi tidak dapat dihitung ulang",
        null,
        403
      );
    }

    await hitungBiayaJobService.addJob(data.id);

    return successResponse(
      res,
      "Berhasil menghitung ulang rincian biaya pegawai mutasi",
      data
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
