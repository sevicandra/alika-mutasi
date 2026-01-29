import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
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

      const pegawai = await PegawaiMutasi.getPegawaiWithStatus(PegawaiId, SkId);
      if (!pegawai) {
        throw new NotFoundError("Pegawai not found");
      }
      if (pegawai.process_termin !== "IDLE" || pegawai.SuratKeputusan.status !== "DRAFT") {
        throw new AuthorizationError("rincian biaya tidak dapat direset, data sudah diproses");
      }

      const data = await RincianBiaya.delete(
        {
          where: {
            pegawai_id: PegawaiId,
          },
        },
        t
      );

      pegawai.process_biaya = "IDLE";
      await pegawai.save({ transaction: t });

      successResponse(res, "Berhasil reset rincian biaya", data);
    },
    {
      useTransaction: true,
    }
  ),
};
