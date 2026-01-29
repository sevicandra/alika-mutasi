import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { terminJobService } from "@/services/createTermin.service";
import { hitungBiayaJobService } from "@/services/hitungBiaya.service";
import { KeluargaJobService } from "@/services/keluarga.service";
import { minioService } from "@/services/minio-service";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import sequelize from "@/config/db.config";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { SuratKeputusan } from "@/repositories";

export const SuratKeputusanControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
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

    const { items: data, pagination } = await SuratKeputusan.findAllWithPagination({
      where,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all surat keputusan", data, pagination);
  }),
  count: asyncHandler(async (req: Request, res: Response) => {
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

    const count = await SuratKeputusan.count({
      where,
    });

    successResponse(res, "Success get all surat keputusan", { count });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.findById(id, {
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
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get surat keputusan", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { nomor, uraian, tanggal, tmt, jenjang } = req.body;
    const data = await SuratKeputusan.create({
      nomor,
      uraian,
      tanggal,
      tmt,
      jenjang,
    });
    successResponse(res, "Success create surat keputusan", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { nomor, uraian, tanggal, tmt, jenjang } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await SuratKeputusan.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          nomor,
          uraian,
          tanggal,
          tmt,
          jenjang,
        },
        t
      );
      successResponse(res, "Success update surat keputusan", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await SuratKeputusan.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete surat keputusan", data);
    },
    {
      useTransaction: true,
    }
  ),
  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await SuratKeputusan.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    const stream = await minioService.getFile(`suratKeputusan/${data.file}`);
    fileResponse(res, stream, `${data.nomor.replace(/\//g, "_")}.pdf`, "application/pdf");
  }),
  getPegawai: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await SuratKeputusan.getPegawai(id);

    successResponse(res, "Success get surat keputusan", data);
  }),
  processKeluarga: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { id } = req.params;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const ids = await SuratKeputusan.processKeluarga(id, t);

      await KeluargaJobService.addBatchJob(ids);
      successResponse(res, "Berhasil memproses data keluarga", {
        id,
      });
    },
    {
      useTransaction: true,
    }
  ),
  hitungBiaya: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { id } = req.params;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const ids = await SuratKeputusan.processKeluarga(id, t);

      await hitungBiayaJobService.addBatchJob(ids);
      successResponse(res, "Berhasil memproses data biaya", {
        id,
      });
    },
    {
      useTransaction: true,
    }
  ),
  processTermin: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { SkId } = req.params;
      if (typeof SkId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { percentage, maximum, tahun_uang_muka, tahun_lunas, type } = req.body;
      const ids = await SuratKeputusan.processTermin(SkId, t);

      if (type === "UANG_MUKA") {
        const pegawai = ids.map((id) => {
          return {
            id: id,
            percentage: percentage,
            maximum: maximum,
            tahun_uang_muka: tahun_uang_muka,
            tahun_lunas: tahun_lunas,
            type: type,
          };
        });
        await terminJobService.addBatchJobs(pegawai);
      } else {
        const pegawai = ids.map((id) => {
          return {
            id: id,
            tahun_uang_muka: tahun_lunas,
            tahun_lunas: tahun_lunas,
            type: type,
          };
        });
        await terminJobService.addBatchJobs(pegawai);
      }
      successResponse(res, "Berhasil memproses data termin", {
        SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
};
