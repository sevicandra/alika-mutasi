import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { KeluargaJobService } from "@/services/keluarga.service";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { Invant } from "@/helpers/age.helper";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga, PegawaiMutasi } from "@/repositories";

export const KeluargaControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId !== "string" || typeof SkId !== "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.nama = { [Op.like]: `%${search}%` };

    const { items: data, pagination } = await Keluarga.findAllWithPagination({
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

    successResponse(res, "Berhasil mengambil data keluarga", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { KeluargaId, PegawaiId, SkId } = req.params;
    if (
      typeof KeluargaId !== "string" ||
      typeof PegawaiId !== "string" ||
      typeof SkId !== "string"
    ) {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Keluarga.findById(KeluargaId, {
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
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Berhasil mengambil data keluarga", data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;

    if (typeof PegawaiId !== "string" || typeof SkId !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const { nik, nama, hubungan, tanggal_lahir, pekerjaan, status } = await req.body;
    const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
    if (!pegawai) {
      throw new NotFoundError("Pegawai not found");
    }

    if (pegawai.process_biaya !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
      throw new AuthorizationError("keluarga tidak dapat ditambahkan, data sudah diproses");
    }

    const is_invant = Invant(new Date(tanggal_lahir), pegawai.SuratKeputusan.tanggal);

    const data = await Keluarga.create({
      pegawai_id: PegawaiId,
      nik,
      nama,
      hubungan,
      tanggal_lahir,
      pekerjaan,
      status,
      is_invant,
    });

    successResponse(res, "Berhasil menambahkan data keluarga", data);
  }),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { KeluargaId, PegawaiId, SkId } = req.params;
      if (
        typeof KeluargaId != "string" ||
        typeof PegawaiId != "string" ||
        typeof SkId != "string"
      ) {
        throw new InvalidRequestError("Invalid request");
      }
      const { nik, nama, hubungan, tanggal_lahir, pekerjaan, status } = req.body;

      const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!pegawai) {
        throw new NotFoundError("Pegawai not found");
      }

      if (pegawai.process_biaya !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
        throw new AuthorizationError("keluarga tidak dapat diubah, data sudah diproses");
      }
      const is_invant = Invant(new Date(tanggal_lahir), pegawai.SuratKeputusan.tanggal);
      const data = await Keluarga.updateOne(
        {
          where: {
            id: KeluargaId,
            pegawai_id: PegawaiId,
          },
        },
        {
          nik,
          nama,
          hubungan,
          tanggal_lahir,
          pekerjaan,
          status,
          is_invant,
        },
        t
      );

      successResponse(res, "Berhasil mengubah data keluarga", data);
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

      const { KeluargaId, PegawaiId, SkId } = req.params;
      if (
        typeof KeluargaId != "string" ||
        typeof PegawaiId != "string" ||
        typeof SkId != "string"
      ) {
        throw new InvalidRequestError("Invalid request");
      }
      const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!pegawai) {
        throw new NotFoundError("Pegawai not found");
      }
      if (pegawai.process_biaya !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
        throw new AuthorizationError("keluarga tidak dapat diubah, data sudah diproses");
      }
      const data = await Keluarga.deleteOne(
        {
          where: {
            id: KeluargaId,
            pegawai_id: PegawaiId,
          },
        },
        t
      );

      successResponse(res, "Berhasil menghapus data keluarga", data);
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
      const data = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!data) {
        throw new NotFoundError("Data not found");
      }

      if (data.SuratKeputusan.status === "SELESAI") {
        throw new AuthorizationError(
          `Status "${data.SuratKeputusan.status}", tidak dapat di reset`
        );
      }

      if (data.status !== "DRAFT") {
        throw new AuthorizationError(`Status "${data.status}", tidak dapat di reset`);
      }

      if (data.process_termin !== "IDLE") {
        throw new AuthorizationError(
          `Proses termin "${data.process_termin}", tidak dapat di reset`
        );
      }

      if (data.process_biaya !== "IDLE") {
        throw new AuthorizationError(`Proses biaya "${data.process_biaya}", tidak dapat di reset`);
      }

      if (data.process_keluarga === "IDLE" || data.process_keluarga === "PROCESSING") {
        throw new AuthorizationError(
          `Status proses keluarga: "${data.process_keluarga}", tidak dapat di reset`
        );
      }

      data.process_keluarga = "IDLE";
      await data.save({ transaction: t });

      if (!data) {
        throw new NotFoundError("Pegawai tidak ditemukan");
      }

      await Keluarga.delete(
        {
          where: {
            pegawai_id: PegawaiId,
          },
        },
        t
      );

      successResponse(res, "Berhasil reset termin", data);
    },
    {
      useTransaction: true,
    }
  ),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { KeluargaId, PegawaiId } = req.params;
    if (typeof KeluargaId != "string" || typeof PegawaiId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Keluarga.findOne({
      where: {
        id: KeluargaId,
        pegawai_id: PegawaiId,
      },
    });
    if (!data || !data.file) {
      throw new NotFoundError("Data not found");
    }
    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.nama}.pdf`, "application/pdf");
  }),

  processKeluarga: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { PegawaiId, SkId } = req.params;
      if (typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);

      if (!data) {
        throw new NotFoundError("Data tidak ditemukan");
      }

      if (data.SuratKeputusan.status === "SELESAI") {
        throw new AuthorizationError(
          `Status "${data.SuratKeputusan.status}", tidak dapat di reset`
        );
      }

      if (data.status !== "DRAFT") {
        throw new AuthorizationError("Status " + data.status + " tidak dapat di proses");
      }

      if (data.process_keluarga !== "IDLE") {
        throw new InvalidRequestError("Proses sudah berjalan : " + data.process_keluarga);
      }

      await KeluargaJobService.addJob(data.id);
      successResponse(res, "Berhasil memproses data keluarga pegawai mutasi", null, 200);
    },
    {
      useTransaction: true,
    }
  ),
};
