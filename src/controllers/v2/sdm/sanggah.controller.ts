import { Sanggah, sequelize, Keluarga } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op, where, col } from "sequelize";
import { Invant } from "@/helpers/age.helper";
import { Logger } from "@/services/log.service";
import { ReviewSanggah } from "@/types/pembayaranLog";
import { AlikaService } from "@/services/alika.service";

export const getAllSanggah = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || "";
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";

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

    const { rows: data, count } = await Sanggah.findAndCountAll({
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
      order: [[sortField, sortOrder.toUpperCase()]],
    });

    return successResponse(res, "Berhasil mengambil data sanggah", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getSanggahById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SanggahId } = req.params;
    const data = await Sanggah.findByPk(SanggahId, {
      include: [
        {
          association: "Pegawai",
          attributes: ["nama", "nip"],
          required: true,
        },
      ],
    });
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data sanggah", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const reviewSanggah = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  const {
    review,
  }: {
    review: {
      id: string;
      is_approved: boolean;
      admin_notes: string;
    }[];
  } = req.body;
  try {
    const { SanggahId } = req.params;
    const { nip } = req.user;
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
      await t.rollback();
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    const dataSanggahIds = data.DataSanggah.map((d: any) => d.id);
    if (
      review.length !== dataSanggahIds.length ||
      !review.every((r) => dataSanggahIds.includes(r.id))
    ) {
      return errorResponse(
        res,
        "belum melakukan review untuk seluruh data",
        null,
        400
      );
    }

    const allReviewed = review.every((r) => r.is_approved !== undefined);
    if (!allReviewed) {
      await t.rollback();
      return errorResponse(
        res,
        "belum melakukan review untuk seluruh data",
        null,
        400
      );
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
          data: d.new_value
            ? JSON.parse(JSON.stringify(d.new_value))
            : undefined,
          catatan: reviewData.admin_notes,
          file: d.file,
          confrimation: reviewData.is_approved,
        });
      }
    }

    data.DataSanggah.filter((d) => d.is_approved === true).forEach(
      async (d) => {
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
          await Keluarga.destroy({
            where: { id: d.keluarga_id },
            transaction: t,
          });
        }
      }
    );
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
    await t.commit();
    return successResponse(res, "Review sanggah berhasil", null, 200);
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};
