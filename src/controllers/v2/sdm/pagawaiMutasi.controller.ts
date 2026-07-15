import { parse } from "csv-parse";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import {
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import {
  DokumenTermin,
  Keluarga,
  PegawaiMutasi,
  RincianBiaya,
  SuratKeputusan,
  Termin,
} from "@/repositories";

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
  publish: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
      }

      const { PegawaiId, SkId } = req.params;
      if (typeof SkId !== "string" || typeof PegawaiId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await PegawaiMutasi.publish(PegawaiId, SkId, t);

      await Logger.GeneralAction({
        pegawai_id: data.id,
        actor_nip: nip,
        actor_role: "SDM",
        action: "Publish Surat Keputusan",
        description: null,
        transaction: t,
      });
      await AlikaService.sendPushNotification({
        nip: data.nip,
        title: "Surat Keputusan Mutasi",
        message:
          "Selamat kami ucapkan kepada Bapak/Ibu atas tugas baru yang diberikan, dalam rangka mempercepat proses pembayaran kami harapkan Bapak/Ibu dapat segera melakukan aproval data keluarga pada aplikasi Alika. Terima Kasih🙏",
      });

      successResponse(res, "Berhasil mempublish data surat keputusan", data);
    },
    {
      useTransaction: true,
    }
  ),
  batal: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
      }

      const { PegawaiId, SkId } = req.params;
      if (typeof SkId !== "string" || typeof PegawaiId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await PegawaiMutasi.batal(PegawaiId, SkId, t);

      await Termin.update(
        {
          status: "DRAFT",
        },
        { where: { pegawai_id: data.id }, transaction: t }
      );
      await DokumenTermin.delete(
        {
          where: {
            termin_id: data.Termin.map((t) => t.id),
          },
        },
        t
      );

      await Logger.GeneralAction({
        pegawai_id: data.id,
        actor_nip: nip,
        actor_role: "SDM",
        action: "Batal Surat Keputusan",
        description: null,
        transaction: t,
      });

      await AlikaService.sendPushNotification({
        nip: data.nip,
        title: "Surat Keputusan Mutasi",
        message:
          "Surat Keputusan Mutasi telah dibatalkan oleh Bagian SDM, karena ada kesalahan teknis",
      });

      for (const termin of data.Termin) {
        for (const dokumen of termin.DokumenTermin) {
          if (dokumen.file) {
            await minioService.deleteFile(dokumen.file);
          }
        }
      }

      successResponse(res, "Berhasil membatalkan surat keputusan", {
        id: SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
};
