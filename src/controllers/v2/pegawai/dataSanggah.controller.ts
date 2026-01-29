import { Request, Response } from "express";
import fs from "fs";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import {
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { UUID } from "@/utils/uuid.util";
import { fileResponse, successResponse } from "@/helpers/respose.helper";
import { DataSanggah, Sanggah } from "@/repositories";

export const DataSanggahController = {
  getAll: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }

      const { mutasiId } = req.params;
      if (typeof mutasiId != "string") {
        throw new InvalidRequestError("Invalid sanggah id");
      }

      const sanggah = await Sanggah.getSanggah(mutasiId, t);

      const limit = parseInt(req.query.limit as string) || undefined;
      const offset = parseInt(req.query.offset as string) || undefined;
      const { items: data, pagination } = await DataSanggah.findAllWithPagination({
        where: { sanggah_id: sanggah.id },
        include: [
          {
            association: "Sanggah",
            attributes: [],
            where: {
              pegawai_id: mutasiId,
            },
          },
          {
            association: "Ref",
          },
        ],
        limit,
        offset,
      });

      successResponse(res, "Berhasil mengambil data sanggah", data, pagination);
    },
    {
      useTransaction: true,
    }
  ),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SanggahId, DataId } = req.params;
    if (typeof SanggahId != "string" || typeof DataId != "string") {
      throw new InvalidRequestError("Invalid sanggah id or data id");
    }
    const data = await DataSanggah.findOne({
      where: { sanggah_id: SanggahId, id: DataId },
    });
    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    successResponse(res, "Berhasil mengambil data sanggah", data);
  }),

  getFile: asyncHandler(async (req: Request, res: Response) => {
    const t = req.transaction;
    if (!t) {
      throw new InternalServerError("Transaction not found");
    }
    const { mutasiId, dataId } = req.params;

    if (typeof mutasiId != "string" || typeof dataId != "string") {
      throw new InvalidRequestError("Parameter tidak valid");
    }
    const sanggah = await Sanggah.getSanggah(mutasiId, t);
    const data = await DataSanggah.findOne({
      where: { sanggah_id: sanggah.id, id: dataId },
    });

    if (!data) {
      throw new NotFoundError("Data tidak ditemukan");
    }

    const fileName = data.file.split("/").pop();
    if (!data.file) {
      throw new NotFoundError("File tidak ditemukan");
    }

    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, fileName || "File.pdf", "application/pdf");
  }),

  create: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
      }
      const { mutasiId } = req.params;

      if (typeof mutasiId != "string") {
        throw new InvalidRequestError("Parameter tidak valid");
      }
      const file = req.file;
      const data = await Sanggah.getSanggah(mutasiId, t);

      const {
        action,
        keluarga_id,
        nama,
        nik,
        hubungan,
        tanggal_lahir,
        pekerjaan,
        status,
        catatan,
      } = req.body;
      let filePath;
      if (file?.path) {
        const buffer = fs.readFileSync(file.path);
        const fileName = UUID.v4();
        filePath = `${data.Pegawai.SuratKeputusan.nomor.replace(/\//g, "_")}/${
          data.Pegawai.nip
        }/${fileName}.pdf`;
        await minioService.uploadFile(buffer, filePath, "application/pdf");
      }

      switch (action) {
        case "ADD":
          await DataSanggah.add(
            {
              id: data.id,
              nama,
              nik,
              hubungan,
              tanggal_lahir,
              pekerjaan,
              status,
              file: filePath,
              catatan,
            },
            t
          );
          break;
        case "EDIT":
          await DataSanggah.edit(
            keluarga_id,
            {
              id: data.id,
              nama,
              nik,
              hubungan,
              tanggal_lahir,
              pekerjaan,
              status,
              file: filePath,
              catatan,
            },
            t
          );
          break;
        case "REMOVE":
          await DataSanggah.remove(
            keluarga_id,
            {
              id: data.id,
              file: filePath,
              nama: nama,
              catatan,
            },
            t
          );
          break;
        default:
          throw new InvalidRequestError("Parameter tidak valid");
          break;
      }
      successResponse(res, "data berhasil dibuat");
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
      const { mutasiId, dataId } = req.params;
      if (typeof mutasiId != "string" || typeof dataId != "string") {
        throw new InvalidRequestError("Invalid sanggah id");
      }

      const sanggah = await Sanggah.getSanggah(mutasiId, t);

      const data = await DataSanggah.deleteOne(
        {
          where: {
            sanggah_id: sanggah.id,
            id: dataId,
          },
        },
        t
      );
      successResponse(res, "Berhasil menghapus data sanggah", data);
    },
    {
      useTransaction: true,
    }
  ),
};
