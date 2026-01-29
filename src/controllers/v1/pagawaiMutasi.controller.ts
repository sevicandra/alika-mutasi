import { parse } from "csv-parse";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga, PegawaiMutasi, RincianBiaya } from "@/repositories";

export const PegawaiMutasiControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { SKId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga = (req.query.process_keluarga as string) || undefined;
    const process_biaya = (req.query.process_biaya as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {};
    if (SKId) where.sk_id = SKId;
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
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const include: any[] = [];
    if (associations) {
      const associationsArray = associations.split(",");
      for (const association of associationsArray) {
        include.push({
          association: association,
        });
      }
    }

    const { items: data, pagination } = await PegawaiMutasi.findAllWithPagination({
      where,
      limit,
      offset,
      order,
      include,
    });

    successResponse(res, "Success get all pegawai mutasi", data, pagination);
  }),
  count: asyncHandler(async (req: Request, res: Response) => {
    const { SKId } = req.params;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga = (req.query.process_keluarga as string) || undefined;
    const process_biaya = (req.query.process_biaya as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {};
    if (SKId) where.sk_id = SKId;
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

    const include: any[] = [];
    if (associations) {
      const associationsArray = associations.split(",");
      for (const association of associationsArray) {
        include.push({
          association: association,
        });
      }
    }

    const count = await PegawaiMutasi.count({
      where,
    });

    successResponse(res, "Success get all pegawai mutasi", { count });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id, SKId } = req.params;

    if (typeof id !== "string" || (SKId && typeof SKId !== "string")) {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PegawaiMutasi.findOne({
      where: {
        id: id,
        sk_id: SKId,
      },
    });
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get pegawai mutasi", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { SKId } = req.params;
    const { sk_id, golongan, kantor_asal, kantor_tujuan, nip, nama } = req.body;

    const data = await PegawaiMutasi.create({
      sk_id: SKId || sk_id,
      golongan,
      kantor_asal,
      kantor_tujuan,
      nip,
      nama,
    });
    successResponse(res, "Success create pegawai mutasi", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id, SKId } = req.params;

      if (typeof id !== "string" || (SKId && typeof SKId !== "string")) {
        throw new InvalidRequestError("Invalid request");
      }

      const { sk_id, golongan, kantor_asal, kantor_tujuan, nip, nama } = req.body;
      if (typeof id !== "string" || (SKId && typeof SKId !== "string")) {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await PegawaiMutasi.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          sk_id,
          golongan,
          kantor_asal,
          kantor_tujuan,
          nip,
          nama,
        },
        t
      );
      successResponse(res, "Success update pegawai mutasi", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const { id, SKId } = req.params;

      if (typeof id !== "string" || (SKId && typeof SKId !== "string")) {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await PegawaiMutasi.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete pegawai mutasi", data);
    },
    {
      useTransaction: true,
    }
  ),
  import: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const { SkId } = req.params;

    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    if (!file) {
      throw new InvalidRequestError("File tidak ditemukan");
    }

    const csvBuffer = file.buffer;
    const records = [];
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
      (r) => !r.nip || !r.nama || !r.kantor_asal || !r.kantor_tujuan || !r.golongan
    );
    if (invalid) {
      throw new InvalidRequestError("Data tidak valid, pastikan semua kolom terisi dengan benar");
    }
    await PegawaiMutasi.createBulk(records);
    successResponse(res, "Success import pegawai mutasi");
  }),
  reset: asyncHandler(async (req: Request, res: Response) => {
    const t = req.transaction;
    if (!t) {
      throw new InternalServerError("Transaction not found");
    }
    const { id, SKId } = req.params;

    if (typeof id !== "string" || (SKId && typeof SKId !== "string")) {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PegawaiMutasi.findById(id);
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    if (SKId && SKId !== data.sk_id) {
      throw new InvalidRequestError("Invalid request");
    }

    if (data.status !== "DRAFT") {
      throw new AuthorizationError("Data tidak dapat diubah");
    }

    data.process_keluarga = "IDLE";
    data.process_biaya = "IDLE";
    await Keluarga.deleteOne({ where: { pegawai_id: id } }, t);

    await RincianBiaya.delete(
      {
        where: { pegawai_id: id },
      },
      t
    );

    await data.save({ transaction: t });
    await data.reload({ transaction: t });

    successResponse(res, "Success reset pegawai mutasi", data);
  }),
};
