import { Request, Response } from "express";
import { Op, col, where } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";
import { AuthenticationError, InvalidRequestError, NotFoundError, InternalServerError} from "@/utils/errors";
import { Invant } from "@/helpers/age.helper";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Keluarga, Sanggah } from "@/repositories";
import { ReviewSanggah } from "@/types/pembayaranLog";

export const SanggahControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) || "id";
    const order = sortBuilder(sort);

    const whereClause = search
      ? {
          [Op.or]: [
            { ticket_number: { [Op.like]: `%${search}%` } },
            where(col("Pegawai.nama"), { [Op.like]: `%${search}%` }),
            where(col("Pegawai.nip"), { [Op.like]: `%${search}%` }),
          ],
          status: "PENDING",
        }
      : { status: "PENDING" };

    const { items: data, pagination } = await Sanggah.findAllWithPagination({
      where: whereClause,
      include: [
        {
          association: "Pegawai",
          attributes: ["nama", "nip"],
          required: true,
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["nomor", "tanggal"],
            },
          ],
        },
      ],
      limit,
      offset,
      order,
    });

    successResponse(res, "Berhasil mengambil data sanggah", data, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { SanggahId } = req.params;
    if (typeof SanggahId) {
      throw new InvalidRequestError("Invalid request");
    }
    const data = await Sanggah.findOne({
      where: { id: SanggahId },
      include: [
        {
          association: "Pegawai",
          attributes: ["nama", "nip"],
          required: true,
        },
      ],
    });
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Berhasil mengambil data sanggah", data);
  }),

  review: asyncHandler(
    async (req: Request, res: Response) => {
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const nip = req.user?.nip;
      if (!nip) {
        throw new AuthenticationError("Pengguna tidak dapat di verifikasi");
      }
      const { SanggahId } = req.params;
      if (typeof SanggahId != "string") {
        throw new InvalidRequestError("Invalid request");
      }

      const {
        review,
      }: {
        review: {
          id: string;
          is_approved: boolean;
          admin_notes: string;
        }[];
      } = req.body;
      const data = await Sanggah.findOne({
        where: { id: SanggahId, status: "PENDING" },
        include: [
          {
            association: "DataSanggah",
          },
          {
            association: "Pegawai",
            attributes: ["nama", "nip", "id", "status"],
            include: [
              {
                association: "SuratKeputusan",
                attributes: ["id", "nomor", "tanggal"],
              },
            ],
          },
        ],
        transaction: t,
      });

      if (!data) {
        throw new NotFoundError("Data not found");
      }

      const dataSanggahIds = data.DataSanggah.map((d: any) => d.id);
      if (
        review.length !== dataSanggahIds.length ||
        !review.every((r) => dataSanggahIds.includes(r.id))
      ) {
        throw new InvalidRequestError("belum melakukan review untuk seluruh data");
      }

      const allReviewed = review.every((r) => r.is_approved !== undefined);
      if (!allReviewed) {
        throw new InvalidRequestError("belum melakukan review untuk seluruh data");
      }
      const logPayload: ReviewSanggah[] = [];

      for (const d of data.DataSanggah) {
        const reviewData = review.find((r) => r.id === d.id);
        if (reviewData) {
          d.is_approved = reviewData.is_approved;
          d.admin_notes = reviewData.admin_notes;
          await d.save({ transaction: t });
          await d.reload({ transaction: t });
          logPayload.push({
            id: d.keluarga_id,
            nama: d.Ref?.nama ? d.Ref.nama : "",
            action: d.action,
            data: d.new_value ? JSON.parse(JSON.stringify(d.new_value)) : undefined,
            catatan: reviewData.admin_notes,
            file: d.file,
            confrimation: reviewData.is_approved,
          });
        }
      }

      data.DataSanggah.filter((d) => d.is_approved === true).forEach(async (d) => {
        if (d.action === "ADD") {
          type NewValueType = {
            nama: { new: string };
            nik: { new: string };
            hubungan: { new: string };
            tanggal_lahir: { new: string };
            pekerjaan: { new: string };
            status: { new: string };
          };
          const newValue = d.new_value as unknown as NewValueType;

          const is_invant = Invant(
            new Date(newValue.tanggal_lahir.new),
            data.Pegawai.SuratKeputusan.tanggal
          );

          await Keluarga.create(
            {
              pegawai_id: data.Pegawai.id,
              nama: newValue.nama.new,
              nik: newValue.nik.new,
              hubungan: newValue.hubungan.new,
              tanggal_lahir: new Date(newValue.tanggal_lahir.new),
              pekerjaan: newValue.pekerjaan.new,
              is_invant: is_invant,
              status: newValue.status.new,
              file: d.file,
            },
            { transaction: t }
          );
        }

        if (d.action === "EDIT") {
          type NewValueType = {
            nama?: { new: string; old: string };
            nik?: { new: string; old: string };
            hubungan?: { new: string; old: string };
            tanggal_lahir?: { new: string; old: string };
            pekerjaan?: { new: string; old: string };
            status?: { new: string; old: string };
          };
          const newValue = d.new_value as unknown as NewValueType;
          await Keluarga.update(
            {
              ...(newValue.nama && { nama: newValue.nama.new }),
              ...(newValue.nik && { nik: newValue.nik.new }),
              ...(newValue.hubungan && { hubungan: newValue.hubungan.new }),
              ...(newValue.tanggal_lahir && {
                tanggal_lahir: new Date(newValue.tanggal_lahir.new),
              }),
              ...(newValue.pekerjaan && { pekerjaan: newValue.pekerjaan.new }),
              ...(newValue.status && { status: newValue.status.new }),
              ...(newValue.tanggal_lahir && {
                is_invant: Invant(
                  new Date(newValue.tanggal_lahir.new),
                  data.Pegawai.SuratKeputusan.tanggal
                ),
              }),
              ...(d.file && { file: d.file }),
            },
            { where: { id: d.keluarga_id }, transaction: t }
          );
        }

        if (d.action === "REMOVE") {
          await Keluarga.deleteOne(
            {
              where: { id: d.keluarga_id },
            },
            t
          );
        }
      });
      data.status = "REVIEWED";
      data.reviewed_at = new Date();
      data.Pegawai.status = "PENDING_APROVAL";
      await data.save({ transaction: t });
      await data.Pegawai.save({ transaction: t });

      await Logger.SanggahanReview({
        pegawai_id: data.Pegawai.id,
        actor_nip: nip,
        action: "Review Sanggah Data Keluarga",
        description: null,
        payload: logPayload,
        transaction: t,
      });

      await AlikaService.sendPushNotification({
        nip: data.Pegawai.nip,
        message: `Sanggah anda telah selesai di review oleh bagian SDM, silahkan memeriksa hasil dan melanjutkan proses pengajuan pembayaran`,
        title: "Sanggah Data Keluarga",
      });

      successResponse(res, "Berhasil melakukan review sanggah");
    },
    {
      useTransaction: true,
    }
  ),
};
