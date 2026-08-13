import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { PegawaiMutasi, Termin } from "@/repositories";

export const TerminControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const { PegawaiId, SkId } = req.params;
    if (typeof PegawaiId != "string" || typeof SkId != "string")
      throw new InvalidRequestError("Invalid request");

    const { items: data, pagination } = await Termin.findAllWithPagination({
      where: {
        pegawai_id: PegawaiId,
      },
      limit,
      offset,
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
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
        {
          association: "Ref",
        },
      ],
    });

    successResponse(res, "Berhasil mendapatkan termin", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { TerminId, PegawaiId, SkId } = req.params;
    if (typeof TerminId != "string" || typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Termin.findById(TerminId, {
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
        {
          association: "Ref",
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    successResponse(res, "Berhasil mendapatkan termin", data);
  }),
  create: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { PegawaiId, SkId } = req.params;
      if (typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const { ref_termin, nominal, tahun } = req.body;

      const pegawai = await PegawaiMutasi.findOne({
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
          {
            association: "MonitoringTagihan",
          },
        ],
        transaction: t,
      });

      if (!pegawai) {
        throw new NotFoundError("Pegawai tidak ditemukan atau SK bukan DRAFT");
      }
      const data = await Termin.create(
        {
          pegawai_id: PegawaiId,
          tahun,
          ref_termin,
          nominal,
        },
        {
          transaction: t,
        }
      );
      await pegawai.reload({
        transaction: t,
      });
      if (pegawai.MonitoringTagihan.sisa_tagihan < 0) {
        throw new AuthorizationError("Termin melebihi sisa tagihan");
      }
      successResponse(res, "Berhasil membuat termin", data);
    },
    {
      useTransaction: true,
    }
  ),
};
