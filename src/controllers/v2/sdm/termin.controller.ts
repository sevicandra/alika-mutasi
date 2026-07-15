import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { terminJobService } from "@/services/createTermin.service";
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
      if (data.process_termin === "IDLE" || data.process_termin === "PROCESSING") {
        throw new AuthorizationError(
          `Status proses termin: "${data.process_termin}", tidak dapat di reset`
        );
      }

      data.process_termin = "IDLE";
      await data.save({ transaction: t });

      if (!data) {
        throw new NotFoundError("Pegawai tidak ditemukan");
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
    },
    {
      useTransaction: true,
    }
  ),
  processTermin: asyncHandler(
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
          `Status "${data.SuratKeputusan.status}", tidak dapat di proses`
        );
      }

      if (data.status !== "DRAFT") {
        throw new AuthorizationError("Status " + data.status + " tidak dapat di proses");
      }

      if (data.process_keluarga !== "DONE") {
        throw new InvalidRequestError("Proses keluarga belum selesai");
      }

      if (data.process_biaya !== "DONE") {
        throw new InvalidRequestError("Proses biaya belum selesai");
      }

      if (data.process_termin !== "IDLE") {
        throw new InvalidRequestError("Proses sudah berjalan : " + data.process_termin);
      }

      const { percentage, maximum, tahun_uang_muka, tahun_lunas, type } = req.body;

      if (type === "UANG_MUKA") {
        await terminJobService.addJob({
          id: data.id,
          percentage: percentage,
          maximum: maximum,
          tahun_uang_muka: tahun_uang_muka,
          tahun_lunas: tahun_lunas,
          type: type,
        });
      } else {
        await terminJobService.addJob({
          id: data.id,
          tahun_uang_muka: tahun_lunas,
          tahun_lunas: tahun_lunas,
          type: type,
        });
      }
      successResponse(res, "Berhasil memproses data termin", {
        SkId,
      });
    },
    {
      useTransaction: true,
    }
  ),
};
