import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RincianBiaya } from "@/repositories";

export const RincianBiayaControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const where: any = {};
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const { items: data, pagination } = await RincianBiaya.findAllWithPagination({
      where,
      limit,
      offset,
      order,
    });

    successResponse(res, "Success get all rincian biaya", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id, PegawaiId } = req.params;

    if (typeof id !== "string" || (PegawaiId && typeof PegawaiId !== "string")) {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RincianBiaya.findOne({
      where: {
        id: id,
        pegawai_id: PegawaiId,
      },
    });
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get rincian biaya", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId } = req.params;
    const { pegawai_id, volume, harga_satuan, jenis, sub_jenis, keterangan, urutan } = req.body;
    const data = await RincianBiaya.create({
      pegawai_id: PegawaiId || pegawai_id,
      volume,
      harga_satuan,
      jenis,
      sub_jenis,
      keterangan,
      urutan,
    });
    successResponse(res, "Success create rincian biaya", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id, PegawaiId } = req.params;
      const { pegawai_id, volume, harga_satuan, jenis, sub_jenis, keterangan, urutan } = req.body;
      if (typeof id !== "string" || (PegawaiId && typeof PegawaiId !== "string")) {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RincianBiaya.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          pegawai_id: PegawaiId || pegawai_id,
          volume,
          harga_satuan,
          jenis,
          sub_jenis,
          keterangan,
          urutan,
        },
        t
      );
      successResponse(res, "Success update rincian biaya", data);
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
      const data = await RincianBiaya.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete rincian biaya", data);
    },
    {
      useTransaction: true,
    }
  ),
};
