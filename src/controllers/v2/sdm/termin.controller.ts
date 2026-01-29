import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { DokumenTermin, PegawaiMutasi, Termin } from "@/repositories";

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
  getDokumen: asyncHandler(async (req: Request, res: Response) => {
    const { TerminId, PegawaiId, SkId } = req.params;
    if (typeof TerminId != "string" || typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await DokumenTermin.findAll({
      where: {
        termin_id: TerminId,
      },
      include: [
        {
          association: "Termin",
          where: {
            pegawai_id: PegawaiId,
          },
          include: [
            {
              association: "Pegawai",
              attributes: ["id", "nama", "nip"],
              where: {
                id: PegawaiId,
              },
            },
          ],
        },
      ],
    });

    successResponse(res, "Berhasil mendapatkan termin", data);
  }),
  getDokumenFile: asyncHandler(async (req: Request, res: Response) => {
    const { TerminId, DokumenId } = req.params;

    if (typeof TerminId != "string" || typeof DokumenId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await DokumenTermin.findOne({
      where: {
        termin_id: TerminId,
        id: DokumenId,
      },
    });
    if (!data || !data.file) {
      throw new NotFoundError("data tidak ditemukan");
    }

    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.document_type}.pdf`, "application/pdf");
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
              status: "DRAFT",
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
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const { TerminId, PegawaiId, SkId } = req.params;
      if (typeof TerminId != "string" || typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const { ref_termin, nominal, status, tahun } = req.body;

      const data = await Termin.updateOne(
        {
          where: {
            id: TerminId,
          },
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
                {
                  association: "MonitoringTagihan",
                },
              ],
            },
          ],
        },
        {
          ref_termin,
          nominal,
          status,
          tahun,
        },
        t
      );

      if (data.Pegawai.MonitoringTagihan.sisa_tagihan < 0) {
        throw new AuthorizationError("Termin melebihi sisa tagihan");
      }

      successResponse(res, "Berhasil memperbarui termin", data);
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
      const { TerminId, PegawaiId, SkId } = req.params;
      if (typeof TerminId != "string" || typeof PegawaiId != "string" || typeof SkId != "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await Termin.deleteOne(
        {
          where: {
            id: TerminId,
          },
          include: [
            {
              association: "Pegawai",
              attributes: [],
              where: {
                id: PegawaiId,
              },
              include: [
                {
                  association: "SuratKeputusan",
                  attributes: [],
                  where: {
                    id: SkId,
                  },
                },
              ],
            },
          ],
        },
        t
      );
      successResponse(res, "Berhasil menghapus termin", data);
    },
    {
      useTransaction: true,
    }
  ),
  reset: asyncHandler(async (req: Request, res: Response) => {
    const t = req.transaction;
    if (!t) {
      throw new InternalServerError("Transaction not found");
    }
    const { PegawaiId, SkId } = req.params;

    if (typeof PegawaiId != "string" || typeof SkId != "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await PegawaiMutasi.updateOne(
      {
        where: {
          id: PegawaiId,
          process_termin: "DONE",
        },
        include: [
          {
            association: "SuratKeputusan",
            attributes: ["id", "nomor", "tanggal"],
            where: {
              id: SkId,
              status: "DRAFT",
            },
          },
        ],
      },
      {
        process_termin: "IDLE",
      },
      t
    );

    if (!data) {
      throw new NotFoundError("Pegawai tidak ditemukan atau SK bukan DRAFT");
    }

    await Termin.delete(
      {
        where: {
          pegawai_id: PegawaiId,
        },
      },
      t
    );

    successResponse(res, "Berhasil reset termin", data);
  },{
    useTransaction: true,
  
  }),
};
