import { SuratKeputusan } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import { MinioService } from "@/services/minio.service";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import { KeluargaJobService } from "@/services/keluarga.service";
import { hitungBiayaJobService } from "@/services/hitungBiaya.service";

const minioService = new MinioService();

export const getAllSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const jenjang = (req.query.jenjang as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search)
      where[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];
    if (jenjang) where.jenjang = jenjang.toUpperCase();
    if (status) where.status = status.toLocaleUpperCase();
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const data = await SuratKeputusan.findAll({
      where,
      limit,
      offset,
      order,
    });
    const count = await SuratKeputusan.count({ where });
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data,
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const countAllSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const jenjang = (req.query.jenjang as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (search)
      where[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];
    if (jenjang) where.jenjang = jenjang;
    if (status) where.status = status;
    const count = await SuratKeputusan.count({ where });
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      count
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getSuratKeputusanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await SuratKeputusan.findByPk(id, {
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM pegawai_mutasi WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "jumlah_pegawai",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(rincian_biaya.harga_satuan * rincian_biaya.volume), 0) FROM pegawai_mutasi JOIN rincian_biaya ON rincian_biaya.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "total_biaya",
          ],
        ],
      },
    });

    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const createSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nomor, uraian, tanggal, tmt, jenjang } = req.body;
    const file = req.file;

    if (!nomor || !uraian || !tanggal || !tmt || !jenjang || !file) {
      return errorResponse(res, "Parameter tidak lengkap", null, 400);
    }
    const fileName = UUID.v4();

    await minioService.uploadFile(
      file.buffer,
      `suratKeputusan/${fileName}.pdf`
    );

    const data = await SuratKeputusan.create({
      nomor,
      uraian,
      tanggal,
      tmt,
      jenjang,
      file: `${fileName}.pdf`,
    });

    return successResponse(res, "Berhasil membuat data surat keputusan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const updateSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { nomor, uraian, tanggal, tmt, jenjang, status } = req.body;
    const file = req.file;
    const data = await SuratKeputusan.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (file) {
      await minioService.uploadFile(file.buffer, `suratKeputusan/${data.file}`);
    }

    if (nomor) data.nomor = nomor;
    if (uraian) data.uraian = uraian;
    if (tanggal) data.tanggal = tanggal;
    if (tmt) data.tmt = tmt;
    if (jenjang) data.jenjang = jenjang;
    if (status) data.status = status;
    await data.save();

    return successResponse(
      res,
      "Berhasil memperbarui data surat keputusan",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await SuratKeputusan.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data darat", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getSuratKeputusanFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await SuratKeputusan.findByPk(id);
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const stream = await minioService.downloadFile(
      `suratKeputusan/${data.file}`
    );
    if (stream) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=");
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

export const getPegawaiSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await SuratKeputusan.findByPk(id, {
      include: [
        {
          association: "Pegawai",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data, 200);
  } catch (error: unknown) {
    next(error);
  }
};

export const processKeluarga = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await SuratKeputusan.findByPk(id, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "IDLE",
            status: "DRAFT",
          },
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }
    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      return errorResponse(res, "Tidak ada pegawai yang terkait", null, 404);
    }
    await KeluargaJobService.addBatchJob(ids);
    return successResponse(res, "Berhasil memproses data keluarga", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const processBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await SuratKeputusan.findByPk(id, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "process_keluarga", "process_biaya", "status"],
          where: {
            process_keluarga: "DONE",
            process_biaya: "IDLE",
            status: "DRAFT",
          },
        },
      ],
    });
    console.log("data", data);

    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    if (data.status !== "DRAFT") {
      return errorResponse(
        res,
        "Surat Keputusan tidak dalam status DRAFT",
        null,
        400
      );
    }

    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      return errorResponse(res, "Tidak ada pegawai yang terkait", null, 404);
    }
    await hitungBiayaJobService.addBatchJob(ids);
    return successResponse(res, "Berhasil memproses data biaya", {
      id,
    });
  } catch (error: unknown) {
    next(error);
  }
};
