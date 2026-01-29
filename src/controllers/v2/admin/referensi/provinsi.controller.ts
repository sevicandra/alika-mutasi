import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { RefKota, RefProvinsi } from "@/repositories";

export const ProvinsiControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const whereClause = search
      ? {
          [Op.or]: [
            where(col("provinsi"), { [Op.like]: `%${search}%` }),
            where(col("kode"), { [Op.like]: `%${search}%` }),
          ],
        }
      : {};

    const { items: data, pagination } = await RefProvinsi.findAllWithPagination({
      limit,
      offset,
      order,
      where: whereClause,
    });

    successResponse(res, "Success get all ref provinsi", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await RefProvinsi.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get ref provinsi", data);
  }),
  getByKode: asyncHandler(async (req: Request, res: Response) => {
    const { KodeProv } = req.params;
    const data = await RefProvinsi.findOne({ where: { kode: KodeProv } });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Success get ref provinsi", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { kode, provinsi } = req.body;
    const data = await RefProvinsi.create({
      kode,
      provinsi,
    });
    successResponse(res, "Success create ref provinsi", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { KodeProv } = req.params;
      const { kode, provinsi } = req.body;
      if (typeof KodeProv !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await RefProvinsi.updateOne(
        {
          where: {
            kode: KodeProv,
          },
        },
        {
          kode,
          provinsi,
        },
        t
      );
      successResponse(res, "Success update ref provinsi", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const { KodeProv } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof KodeProv !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefProvinsi.deleteOne(
        {
          where: {
            kode: KodeProv,
          },
        },
        t
      );
      successResponse(res, "Success delete provinsi", data);
    },
    {
      useTransaction: true,
    }
  ),
  getKotas: asyncHandler(async (req: Request, res: Response) => {
    const { KodeProv } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    const whereClause: any = {
      kode_provinsi: KodeProv,
    };
    if (search) {
      whereClause[Op.or] = [
        where(col("kota"), { [Op.like]: `%${search}%` }),
        where(col("kode"), { [Op.like]: `%${search}%` }),
      ];
    }
    const { items: data, pagination } = await RefKota.findAllWithPagination({
      where: whereClause,
      limit,
      offset,
      order: [[sortField, sortOrder.toUpperCase()]],
    });
    successResponse(res, "Berhasil mengambil data pegawai", data, pagination);
  }),
  getKotaByKode: asyncHandler(async (req: Request, res: Response) => {
    const { KodeProv, KodeKota } = req.params;
    const data = await RefKota.findOne({
      where: { kode: KodeKota, kode_provinsi: KodeProv },
    });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    successResponse(res, "Berhasil mengambil data provinsi", data);
  }),
  createKota: asyncHandler(async (req: Request, res: Response) => {
    const { KodeProv } = req.params;
    const { kota, kode } = req.body;
    if (typeof KodeProv != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await RefKota.create({
      kota,
      kode,
      kode_provinsi: KodeProv,
    });
    successResponse(res, "Berhasil menambahkan data kota", data);
  }),
  updateKota: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { KodeProv, KodeKota } = req.params;
      const { kota, kode } = req.body;
      if (typeof KodeProv != "string" || typeof KodeKota != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefKota.updateOne(
        {
          where: {
            kode: KodeKota,
            kode_provinsi: KodeProv,
          },
        },
        {
          kota,
          kode,
        },
        t
      );
      successResponse(res, "Berhasil mengubah data kota", data);
    },
    {
      useTransaction: true,
    }
  ),
  deleteKota: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { KodeProv, KodeKota } = req.params;
      if (typeof KodeProv !== "string" || typeof KodeKota !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await RefKota.deleteOne(
        {
          where: {
            kode: KodeKota,
            kode_provinsi: KodeProv,
          },
        },
        t
      );
      successResponse(res, "Success delete provinsi", data);
    },
    {
      useTransaction: true,
    }
  ),
};
