import { parse } from "csv-parse";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { hitungBiayaJobService } from "@/services/hitungBiaya.service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga, PegawaiMutasi, RincianBiaya, SuratKeputusan, Termin } from "@/repositories";

export const PegawaiMutasiControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga = (req.query.process_keluarga as string) || undefined;
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

    successResponse(res, "Berhasil mengambil data pegawai mutasi", data, pagination);
  }),
  count: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const process_keluarga = (req.query.process_keluarga as string) || undefined;
    const process_biaya = (req.query.process_biaya as string) || undefined;
    const process_termin = (req.query.process_termin as string) || undefined;
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
    const count = await PegawaiMutasi.count({
      where,
    });

    successResponse(res, "Berhasil mengambil data pegawai mutasi", { count });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;

    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PegawaiMutasi.findById(PegawaiId, {
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
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Berhasil mengambil data pegawai mutasi", data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const { golongan, kantor_asal, kantor_tujuan, nip, nama } = req.body;

    const sk = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: "DRAFT",
      },
    });
    if (!sk) {
      throw new AuthorizationError("Surat Keputusan sudah di publish, tidak dapat mengubah data");
    }

    const data = await PegawaiMutasi.create({
      sk_id: SkId,
      golongan,
      kantor_asal,
      kantor_tujuan,
      nip,
      nama,
    });

    successResponse(res, "Berhasil membuat data pegawai mutasi", data);
  }),

  import: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const { SkId } = req.params;

    if (typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    if (!file) {
      throw new InvalidRequestError("File tidak ditemukan");
    }

    const sk = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: "DRAFT",
      },
    });
    if (!sk) {
      throw new AuthorizationError("Surat Keputusan sudah di publish, tidak dapat mengubah data");
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
      throw new InvalidRequestError("Data tidak valid");
    }
    await PegawaiMutasi.createBulk(records);
    successResponse(res, "Berhasil membuat data pegawai mutasi", null, 201);
  }),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { PegawaiId, SkId } = req.params;
      if (typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { golongan, kantor_asal, kantor_tujuan, nip, nama } = req.body;

      const data = await PegawaiMutasi.updateOne(
        {
          where: {
            id: PegawaiId,
            status: "DRAFT",
            process_keluarga: "IDLE",
          },
          include: {
            association: "SuratKeputusan",
            attributes: [],
            where: {
              status: "DRAFT",
              id: SkId,
            },
          },
        },
        {
          golongan,
          kantor_asal,
          kantor_tujuan,
          nip,
          nama,
        },
        t
      );

      successResponse(res, "Berhasil memperbarui data pegawai mutasi", data);
    },
    {
      useTransaction: true,
    }
  ),

  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { PegawaiId, SkId } = req.params;
      if (typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await PegawaiMutasi.deleteOne(
        {
          where: {
            id: PegawaiId,
            status: "DRAFT",
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: [],
              where: {
                id: SkId,
                status: "DRAFT",
              },
            },
          ],
        },
        t
      );

      successResponse(res, "Berhasil menghapus data pegawai mutasi", data);
    },
    {
      useTransaction: true,
    }
  ),

  reset: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { PegawaiId, SkId } = req.params;
      if (typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      await PegawaiMutasi.updateOne(
        {
          where: {
            id: PegawaiId,
            status: "DRAFT",
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: [],
              where: {
                id: SkId,
                status: "DRAFT",
              },
            },
          ],
        },
        {
          process_keluarga: "IDLE",
          process_biaya: "IDLE",
          process_termin: "IDLE",
        },
        t
      );

      await Keluarga.delete({ where: { pegawai_id: PegawaiId } }, t);
      await RincianBiaya.delete({ where: { pegawai_id: PegawaiId } }, t);
      await Termin.delete({ where: { pegawai_id: PegawaiId } }, t);

      successResponse(res, "Berhasil mereset proses pegawai mutasi", null, 200);
    },
    {
      useTransaction: true,
    }
  ),

  hitung: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PegawaiMutasi.findOne({
      where: {
        id: PegawaiId,
        status: "DRAFT",
        process_keluarga: "DONE",
        process_termin: "IDLE",
        SuratKeputusan: {
          status: "DRAFT",
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          attributes: [],
        },
      ],
    });

    if (!data) {
      throw new NotFoundError("Data not found");
    }

    await hitungBiayaJobService.addJob(data.id);
    successResponse(res, "Berhasil menghitung biaya pegawai mutasi", data);
  }),
};
