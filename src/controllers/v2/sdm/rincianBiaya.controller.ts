import { Request, Response } from "express";
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
import { PegawaiMutasi, RincianBiaya } from "@/repositories";

export const RincianBiayaControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const sort = (req.query.sort as string) || "jenis,urutan";
    const order = sortBuilder(sort);

    const { items: data, pagination } = await RincianBiaya.findAllWithPagination({
      where: { pegawai_id: PegawaiId },
      order,
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

    successResponse(res, "Berhasil mengambil data pegawai", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId, SkId, RincianBiayaId } = req.params;

    if (
      typeof PegawaiId != "string" ||
      typeof SkId != "string" ||
      typeof RincianBiayaId != "string"
    ) {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RincianBiaya.findById(RincianBiayaId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          where: {
            id: PegawaiId,
            sk_id: SkId,
          },
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["id", "nomor", "tanggal"],
            },
          ],
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Berhasil mengambil data rincian biaya", data);
  }),

  create: asyncHandler(
    async (req: Request, res: Response) => {
      const { PegawaiId, SkId } = req.params;

      if (typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const { jenis, sub_jenis, keterangan, volume, harga_satuan, urutan } = req.body;

      const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!pegawai) {
        throw new NotFoundError("Pegawai not found");
      }
      if (pegawai.process_termin !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
        throw new AuthorizationError("rincian biaya tidak dapat ditambahkan, data sudah diproses");
      }

      const data = await RincianBiaya.create({
        pegawai_id: PegawaiId,
        jenis,
        sub_jenis,
        keterangan,
        volume,
        harga_satuan,
        urutan,
      });

      successResponse(res, "Berhasil membuat rincian biaya", data);
    },
    {
      useTransaction: true,
    }
  ),

  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { PegawaiId, SkId, RincianBiayaId } = req.params;

      if (
        typeof PegawaiId != "string" ||
        typeof SkId != "string" ||
        typeof RincianBiayaId != "string"
      ) {
        throw new InvalidRequestError("Invalid request");
      }

      const { jenis, sub_jenis, keterangan, volume, harga_satuan, urutan } = req.body;
      const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!pegawai) {
        throw new NotFoundError("Pegawai not found");
      }
      if (pegawai.process_termin !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
        throw new AuthorizationError("rincian biaya tidak dapat ditambahkan, data sudah diproses");
      }

      const data = await RincianBiaya.updateOne(
        {
          where: {
            pegawai_id: PegawaiId,
            id: RincianBiayaId,
          },
        },
        {
          jenis,
          sub_jenis,
          keterangan,
          volume,
          harga_satuan,
          urutan,
        },
        t
      );

      successResponse(res, "Berhasil mengubah rincian biaya", data);
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

      const { PegawaiId, SkId, RincianBiayaId } = req.params;

      if (
        typeof PegawaiId != "string" ||
        typeof SkId != "string" ||
        typeof RincianBiayaId != "string"
      ) {
        throw new InvalidRequestError("Invalid request");
      }

      const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!pegawai) {
        throw new NotFoundError("Pegawai not found");
      }
      if (pegawai.process_termin !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
        throw new AuthorizationError("rincian biaya tidak dapat dihapus, data sudah diproses");
      }

      const data = await RincianBiaya.deleteOne(
        {
          where: {
            pegawai_id: PegawaiId,
            id: RincianBiayaId,
          },
        },
        t
      );

      successResponse(res, "Berhasil menghapus rincian biaya", data);
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

      if (data.process_biaya === "IDLE" || data.process_biaya === "PROCESSING") {
        throw new AuthorizationError(
          `Status proses biaya: "${data.process_biaya}", tidak dapat di reset`
        );
      }

      data.process_biaya = "IDLE";
      await data.save({ transaction: t });

      if (!data) {
        throw new NotFoundError("Pegawai tidak ditemukan");
      }

      await RincianBiaya.delete(
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

  hitungBiaya: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const { PegawaiId, SkId } = req.params;
      if (typeof PegawaiId !== "string" || typeof SkId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const data = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);

      if (!data) {
        throw new NotFoundError("Data not found");
      }

      if (data.SuratKeputusan.status === "SELESAI") {
        throw new AuthorizationError(
          `Status "${data.SuratKeputusan.status}", tidak dapat di hitung`
        );
      }

      if (data.status !== "DRAFT") {
        throw new AuthorizationError("Status " + data.status + " tidak dapat di proses");
      }

      if (data.process_keluarga !== "DONE") {
        throw new InvalidRequestError("Proses keluarga belum selesai");
      }

      if (data.process_biaya !== "IDLE") {
        throw new InvalidRequestError("Proses sudah berjalan : " + data.process_biaya);
      }

      await hitungBiayaJobService.addJob(data.id);
      successResponse(res, "Berhasil menghitung biaya pegawai mutasi", data);
    },
    {
      useTransaction: true,
    }
  ),
};
