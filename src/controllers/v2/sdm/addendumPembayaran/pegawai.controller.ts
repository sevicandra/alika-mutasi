import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { GenerateFileService } from "@/services/generateFile.service";
import { minioService } from "@/services/minio-service";
import {
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
} from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import {
  DokumenTermin,
  MonitoringTagihan,
  PegawaiMutasi,
  RefTermin,
  SuratKeputusan,
  Termin,
  TteDokumen,
} from "@/repositories";

export const PegawaiMutasiControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { SkId } = req.params;
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const kantor_asal = (req.query.kantor_asal as string) || undefined;
    const kantor_tujuan = (req.query.kantor_tujuan as string) || undefined;
    const nip = (req.query.nip as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const associations = (req.query.associations as string) || undefined;
    const where: any = {
      sk_id: SkId,
    };
    if (kantor_asal) where.kantor_asal = kantor_asal;
    if (kantor_tujuan) where.kantor_tujuan = kantor_tujuan;
    if (nip) where.nip = nip;
    if (status) where.status = status;
    if (search)
      where[Op.or] = [
        {
          nama: { [Op.like]: `%${search}%` },
        },
        {
          nip: { [Op.like]: `%${search}%` },
        },
      ];
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const include: any[] = [];
    if (associations) {
      const associationsArray = associations.split(",");
      for (const association of associationsArray) {
        include.push({
          association: association,
        });
      }
    }
    const { items: data, pagination } = await PegawaiMutasi.findAllWithPagination({
      where,
      limit,
      offset,
      order,
      include,
    });

    successResponse(res, "Berhasil mendapatkan dokumen", data, pagination);
  }),
  process: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }

      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
      }

      const { SkId, PegawaiId } = req.params;
      if (typeof SkId !== "string" || typeof PegawaiId !== "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const suratKeputusan = await SuratKeputusan.findById(SkId);
      if (!suratKeputusan) {
        throw new NotFoundError("Data tidak ditemukan");
      }
      if (suratKeputusan.status !== "SELESAI") {
        throw new AuthorizationError("Surat Keputusan harus dalam status selesai");
      }

      const tagihan = await MonitoringTagihan.findOne({
        where: {
          pegawai_id: PegawaiId,
        },
        transaction: t,
      });
      if (!tagihan) {
        throw new NotFoundError("Data tidak ditemukan");
      }
      if (tagihan.sisa_tagihan <= 0) {
        throw new InvalidRequestError("tidak ada kekurangan pembayaran");
      }
      const ref = await RefTermin.findOne({
        where: {
          kode: "04",
        },
      });
      if (!ref) {
        throw new NotFoundError("Referensi Termin tidak ditemukan");
      }

      const termin = await Termin.create(
        {
          pegawai_id: PegawaiId,
          tahun: new Date().getFullYear().toString(),
          ref_termin: ref.kode,
          nominal: tagihan.sisa_tagihan,
        },
        {
          transaction: t,
        }
      );

      termin.reload({
        include: [
          {
            association: "Ref",
          },
        ],
        transaction: t,
      });

      const pegawai = await PegawaiMutasi.findOne({
        where: {
          id: PegawaiId,
          sk_id: SkId,
        },
        include: [
          {
            association: "Termin",
            order: [["urutan", "DESC"]],
            include: [
              {
                association: "Ref",
              },
            ],
          },
          {
            association: "RincianBiaya",
          },
          {
            association: "KantorAsal",
            include: [{ association: "Kota" }],
          },
          {
            association: "KantorTujuan",
            include: [{ association: "Kota" }],
          },
          {
            association: "SuratKeputusan",
          },
          {
            association: "Golongan",
          },
        ],
        transaction: t,
      });
      if (!pegawai) {
        throw new NotFoundError("Data tidak ditemukan");
      }
      const uploadedFiles: string[] = [];
      try {
        const files = await GenerateFileService.generateFileKekurangan(pegawai, termin);

        for (const file of files) {
          if (file.file) uploadedFiles.push(file.file);
        }
        for (const file of files) {
          const dokumen = await DokumenTermin.create(
            {
              termin_id: file.termin_id,
              document_type: file.jenis,
              file: file.file,
              required: file.required,
              uploadable: file.uploadable,
            },
            { transaction: t }
          );
          for (const tte of file.penandatangan) {
            await TteDokumen.create(
              {
                nama: tte.nama,
                dokumen_id: dokumen.id,
                nip: tte.nip,
                jabatan: tte.jabatan,
                koordinat_qr: {
                  page: tte.koordinat.page,
                  x: tte.koordinat.x,
                  y: tte.koordinat.y,
                },
              },
              { transaction: t }
            );
          }
        }
      } catch (error: unknown) {
        for (const filePath of uploadedFiles) {
          try {
            await minioService.deleteFile(filePath);
          } catch (deleteError) {
            console.warn(`Gagal menghapus file rollback: ${filePath}`, deleteError);
          }
        }
        if (error instanceof Error) {
          throw new InternalServerError(`Gagal generate file: ${error.message}`);
        } else {
          throw new InternalServerError(`Gagal generate file: ${JSON.stringify(error)}`);
        }
      }

      successResponse(res, "Berhasil memproses pegawai", termin);
    },
    {
      useTransaction: true,
    }
  ),
};
