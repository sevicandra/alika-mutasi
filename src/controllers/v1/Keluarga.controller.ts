import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga } from "@/repositories";

export const KeluargaControllerV1 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const pegawai_id = req.params.pegawai_id || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {};
    if (pegawai_id) where.pegawai_id = pegawai_id;
    if (status) where.status = status;
    if (search) where.nama = { [Op.like]: `%${search}%` };
    if (PegawaiId) where.pegawai_id = PegawaiId;
    const include: any[] = [];
    if (associations) {
      const associationsArray = associations.split(",");
      for (const association of associationsArray) {
        include.push({
          association: association,
        });
      }
    }

    const { items: data, pagination } = await Keluarga.findAllWithPagination({
      where,
      limit,
      offset,
      order,
      include,
    });

    successResponse(res, "Success get all keluarga", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id, PegawaiId } = req.params;

    if (typeof id !== "string" || (PegawaiId && typeof PegawaiId !== "string")) {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await Keluarga.findById(id);

    if (!data || data.pegawai_id !== PegawaiId) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get keluarga", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { PegawaiId } = req.params;
    const { pegawai_id, nik, nama, hubungan, tanggal_lahir, is_invant, pekerjaan, status } =
      req.body;
    const data = await Keluarga.create({
      pegawai_id: PegawaiId || pegawai_id,
      nik,
      nama,
      hubungan,
      tanggal_lahir,
      is_invant,
      pekerjaan,
      status,
    });
    successResponse(res, "Success create keluarga", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id, PegawaiId } = req.params;
      const { nik, nama, hubungan, tanggal_lahir, is_invant, pekerjaan, status } = req.body;
      if (typeof id !== "string" || (PegawaiId && typeof PegawaiId !== "string")) {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await Keluarga.updateOne(
        {
          where: {
            id: id,
            pegawai_id: PegawaiId,
          },
        },
        {
          nik,
          nama,
          hubungan,
          tanggal_lahir,
          is_invant,
          pekerjaan,
          status,
        },
        t
      );
      successResponse(res, "Success update keluarga", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const { id, PegawaiId } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof id !== "string" || (PegawaiId && typeof PegawaiId !== "string")) {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await Keluarga.deleteOne(
        {
          where: {
            id: id,
            pegawai_id: PegawaiId,
          },
        },
        t
      );
      successResponse(res, "Success delete keluarga", data);
    },
    {
      useTransaction: true,
    }
  ),
};
