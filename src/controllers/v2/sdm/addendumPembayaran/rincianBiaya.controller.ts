import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
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
};
