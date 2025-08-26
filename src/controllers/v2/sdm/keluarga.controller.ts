import { Keluarga, PegawaiMutasi } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { Invant } from "@/helpers/age.helper";
import { MinioService } from "@/services/minio.service";

const minioService = new MinioService();

export const getAllKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { PegawaiId, SkId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.nama = { [Op.like]: `%${search}%` };
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const keluarga = await Keluarga.findAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          association: "Ref",
          attributes: ["nama"],
        },
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            sk_id: SkId,
          },
        },
      ],
    });
    return successResponse(res, "Berhasil mengambil data keluarga", keluarga);
  } catch (error: unknown) {
    next(error);
  }
};

export const getKeluargaById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { KeluargaId, PegawaiId, SkId } = req.params;
    const keluarga = await Keluarga.findByPk(KeluargaId, {
      include: [
        {
          association: "Ref",
          attributes: ["nama"],
        },
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            sk_id: SkId,
          },
        },
      ],
    });
    if (!keluarga) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data keluarga", keluarga);
  } catch (error: unknown) {
    next(error);
  }
};

export const createKeluarga = async (
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
    const { nik, nama, hubungan, tanggal_lahir, pekerjaan, status } =
      await req.body;

    if (!PegawaiId)
      ValidationError.push({
        field: "pegawai_id",
        message: "tidak boleh kosong",
      });
    if (!nama)
      ValidationError.push({ field: "nama", message: "tidak boleh kosong" });
    if (!hubungan)
      ValidationError.push({
        field: "hubungan",
        message: "tidak boleh kosong",
      });
    if (!tanggal_lahir)
      ValidationError.push({
        field: "tanggal_lahir",
        message: "tidak boleh kosong",
      });
    if (!pekerjaan)
      ValidationError.push({
        field: "pekerjaan",
        message: "tidak boleh kosong",
      });
    if (!status)
      ValidationError.push({ field: "status", message: "tidak boleh kosong" });
    if (ValidationError.length > 0) {
      return errorResponse(res, "Data tidak lengkap", ValidationError, 422);
    }

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
      pegawai.process_biaya !== "IDLE" ||
      pegawai.SuratKeputusan.status !== "DRAFT"
    ) {
      return errorResponse(res, "sudah dilakukan proses biaya", null, 409);
    }

    const is_invant = Invant(
      new Date(tanggal_lahir),
      pegawai.SuratKeputusan.tanggal
    );
    const keluarga = await Keluarga.create({
      pegawai_id: PegawaiId,
      nik,
      nama,
      hubungan,
      tanggal_lahir,
      is_invant,
      pekerjaan,
      status,
    });

    if (!keluarga) {
      return errorResponse(res, "Gagal menambahkan data keluarga", null, 500);
    }
    return successResponse(res, "Berhasil menambahkan data keluarga", keluarga);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { KeluargaId, PegawaiId, SkId } = req.params;
    const { nik, nama, hubungan, tanggal_lahir, pekerjaan, status } = req.body;
    const data = await Keluarga.findByPk(KeluargaId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            process_biaya: "IDLE",
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
      ],
    });
    if (!data) {
      return errorResponse(
        res,
        "perubahan data tidak dapat di proses",
        null,
        409
      );
    }

    if (PegawaiId) data.pegawai_id = PegawaiId;
    if (nik) data.nik = nik;
    if (nama) data.nama = nama;
    if (hubungan) data.hubungan = hubungan;
    if (tanggal_lahir) data.tanggal_lahir = tanggal_lahir;
    if (tanggal_lahir)
      data.is_invant = Invant(
        new Date(tanggal_lahir),
        data.Pegawai.SuratKeputusan.tanggal
      );
    if (pekerjaan) data.pekerjaan = pekerjaan;
    if (status) data.status = status;
    await data.save();
    return successResponse(res, "Berhasil mengubah data keluarga", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { KeluargaId, PegawaiId, SkId } = req.params;
    const data = await Keluarga.findByPk(KeluargaId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            process_biaya: "IDLE",
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
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 409);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data keluarga", {
      id: KeluargaId,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getFileKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { KeluargaId, PegawaiId } = req.params;
  try {
    const data = await Keluarga.findOne({
      where: {
        id: KeluargaId,
        pegawai_id: PegawaiId,
      },
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
          `inline; filename=${data.nama}.pdf`
        );
        return res.status(200).send(Buffer.concat(chunks));
      });
      stream.on("error", (err: Error) => {
        return errorResponse(res, "Terjadi kesalahan", err, 500);
      });
    }
  } catch (error: unknown) {
    next(error);
  }
};
