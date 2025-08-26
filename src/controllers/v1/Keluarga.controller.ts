import { Keluarga } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllKeluarga = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { PegawaiId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const pegawai_id = req.params.pegawai_id || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {};
    if (pegawai_id) where.pegawai_id = pegawai_id;
    if (status) where.status = status;
    if (search) where.nama = { [Op.like]: `%${search}%` };
    if (PegawaiId) where.pegawai_id = PegawaiId;
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
    const keluarga = await Keluarga.findAll({
      where,
      limit,
      offset,
      order,
      include,
    });
    return successResponse(res, "Berhasil mengambil data keluarga", keluarga);
  } catch (error: unknown) {
    next(error)
  }
};

export const getKeluargaById = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id, PegawaiId } = req.params;
    const keluarga = await Keluarga.findByPk(id);
    if (!keluarga || keluarga.pegawai_id !== PegawaiId) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data keluarga", keluarga);
  } catch (error: unknown) {
    next(error)
  }
};

export const createKeluarga = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  const { PegawaiId } = req.params;
  try {
    const {
      pegawai_id,
      nik,
      nama,
      hubungan,
      tanggal_lahir,
      is_invant,
      pekerjaan,
      status,
    } = req.body;
    if (
      (!pegawai_id && PegawaiId) ||
      !nama ||
      !hubungan ||
      !tanggal_lahir ||
      !is_invant ||
      !status
    ) {
      return errorResponse(res, "Data tidak lengkap", null, 400);
    }

    const keluarga = await Keluarga.create({
      pegawai_id: PegawaiId || pegawai_id,
      nik,
      nama,
      hubungan,
      tanggal_lahir,
      is_invant,
      pekerjaan,
      status,
    });
    return successResponse(res, "Berhasil menambahkan data keluarga", keluarga);
  } catch (error: unknown) {
    next(error)
  }
};

export const updateKeluarga = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id, PegawaiId } = req.params;
    const {
      pegawai_id,
      nik,
      nama,
      hubungan,
      tanggal_lahir,
      invant,
      pekerjaan,
      status,
    } = req.body;

    const data = await Keluarga.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (pegawai_id || PegawaiId) data.pegawai_id = pegawai_id || PegawaiId;
    if (nik) data.nik = nik;
    if (nama) data.nama = nama;
    if (hubungan) data.hubungan = hubungan;
    if (tanggal_lahir) data.tanggal_lahir = tanggal_lahir;
    if (invant) data.is_invant = invant;
    if (pekerjaan) data.pekerjaan = pekerjaan;
    if (status) data.status = status;
    await data.save();
    return successResponse(res, "Berhasil mengubah data keluarga", data);
  } catch (error: unknown) {
    next(error)
  }
};

export const deleteKeluarga = async (
  req: AuthenticatedRequest,
  res: Response, next:NextFunction
) => {
  try {
    const { id, PegawaiId } = req.params;
    const data = await Keluarga.findByPk(id);
    if (!data || data.pegawai_id !== PegawaiId) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data keluarga", {
      id,
    });
  } catch (error: unknown) {
    next(error)
  }
};
