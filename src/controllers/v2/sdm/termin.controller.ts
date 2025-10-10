import { PegawaiMutasi, Termin, DokumenTermin } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import sequelize from "@/config/db.config";
import { MinioService } from "@/services/minio.service";
const minioService = new MinioService();

export const getAllTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { PegawaiId, SkId } = req.params;
    const where: any = {};
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const termin = await Termin.findAll({
      where,
      limit,
      offset,
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
        {
          association: "Ref",
        },
      ],
    });
    const count = await Termin.count({
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
    });
    return successResponse(res, "Berhasil mendapatkan termin", termin, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getTerminById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { TerminId, PegawaiId, SkId } = req.params;
    const data = await Termin.findByPk(TerminId, {
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
        {
          association: "Ref",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mendapatkan termin", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const getDokumen = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { TerminId, PegawaiId, SkId } = req.params;
    const data = await Termin.findByPk(TerminId, {
      include: [
        {
          association: "Pegawai",
          attributes: [],
          where: {
            id: PegawaiId,
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: [],
              where: {
                id: SkId,
              },
            },
          ],
        },
        {
          association: "DokumenTermin",
        },
        {
          association: "Ref",
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mendapatkan termin",
      data.DokumenTermin
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getDokumenFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { TerminId, DokumenId } = req.params;
    const data = await DokumenTermin.findOne({
      where: {
        termin_id: TerminId,
        id: DokumenId,
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
          `inline; filename="${data.document_type}.pdf"`
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
    next(error);
  }
};

export const createTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const ValidationError: {
      field: string;
      message: string;
    }[] = [];
    const { PegawaiId, SkId } = req.params;
    const { ref_termin, nominal, tahun } = req.body;
    const pegawai = await PegawaiMutasi.findByPk(PegawaiId, {
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal"],
          where: {
            id: SkId,
            status: "DRAFT",
          },
        },
        {
          association: "MonitoringTagihan",
        },
      ],
    });

    if (!pegawai) {
      return errorResponse(
        res,
        "penambahan termin tidak dapat dilakukan",
        null,
        409
      );
    }

    if (!ref_termin)
      ValidationError.push({
        field: "ref_termin",
        message: "Referensi Termin harus diisi",
      });

    if (!tahun)
      ValidationError.push({
        field: "tahun",
        message: "Tahun harus diisi",
      });

    if (!nominal)
      ValidationError.push({
        field: "nominal",
        message: "Nominal harus diisi",
      });

    if (nominal && pegawai.MonitoringTagihan.sisa_tagihan < nominal)
      ValidationError.push({
        field: "nominal",
        message: "Nominal melebihi sisa tagihan",
      });

    if (ValidationError.length > 0) {
      await t.rollback();
      return errorResponse(res, "validation error", ValidationError, 422);
    }

    const data = await Termin.create({
      pegawai_id: PegawaiId,
      tahun,
      ref_termin,
      nominal,
    });
    await t.commit();
    return successResponse(res, "Termin berhasil dibuat", data);
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};

export const updateTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { TerminId, PegawaiId, SkId } = req.params;
    const { ref_termin, nominal, status, tahun } = req.body;
    const data = await Termin.findByPk(TerminId, {
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
            {
              association: "MonitoringTagihan",
            },
          ],
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    if (ref_termin) data.ref_termin = ref_termin;
    if (nominal) data.nominal = nominal;
    if (status) data.status = status;
    if (tahun) data.tahun = tahun;

    await data.save({ transaction: t });
    await data.reload({ transaction: t });
    if (data.Pegawai.MonitoringTagihan.sisa_tagihan < 0) {
      await t.rollback();
      return errorResponse(
        res,
        "Termin melebihi sisa tagihan",
        [
          {
            field: "nominal",
            message: "Nominal melebihi sisa tagihan",
          },
        ],
        422
      );
    }
    await t.commit();
    return successResponse(res, "Termin berhasil diperbarui", data);
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};

export const deleteTermin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { TerminId, PegawaiId, SkId } = req.params;
    const data = await Termin.findByPk(TerminId, {
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
    if (!data) {
      return errorResponse(res, "Termin tidak ditemukan", null, 404);
    }
    await data.destroy();
    return successResponse(res, "Termin berhasil dihapus", {
      id: TerminId,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const resetTermin = async (
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
        process_termin: "DONE",
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

    await Termin.destroy({
      where: {
        pegawai_id: PegawaiId,
      },
      transaction: t,
    });

    data.process_termin = "IDLE";
    await data.save({ transaction: t });

    await t.commit();
    return successResponse(res, "Berhasil reset rincian biaya", null);
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};
