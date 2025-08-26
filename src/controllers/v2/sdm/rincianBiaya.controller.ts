import { RincianBiaya, PegawaiMutasi } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import sequelize from "@/config/db.config";

export const getAllRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
    next(error);
  }
};

export const getRincianBiayaById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
    next(error);
  }
};

export const createRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
    next(error);
  }
};

export const updateRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
    next(error);
  }
};

export const deleteRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
    next(error);
  }
};

export const resetRincianBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
    next(error);
  }
};
