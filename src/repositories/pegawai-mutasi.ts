import { Op, Transaction, col } from "sequelize";
import { AuthorizationError, NotFoundError } from "@/utils/errors";
import { PegawaiMutasi } from "@/models";
import { PembayaranLog, Termin } from ".";
import { BaseRepository } from "./base-repository";

export class PegawaiMutasiRepository extends BaseRepository<PegawaiMutasi> {
  constructor() {
    super(PegawaiMutasi);
  }

  async getStatus(nip: string) {
    return await this.findOne({
      where: {
        nip,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
      include: [
        {
          association: "KantorAsal",
          attributes: [],
        },
        {
          association: "KantorTujuan",
          attributes: [],
        },
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: [
        "id",
        [col("SuratKeputusan.tanggal"), "tanggal"],
        [col("SuratKeputusan.nomor"), "nomor"],
        [col("KantorAsal.kantor"), "kantor_asal"],
        [col("KantorTujuan.kantor"), "kantor_tujuan"],
        "status",
      ],
    });
  }

  async getStatusDokumen(nip: string) {
    const mutasi = await this.findOne({
      where: {
        nip,
        status: {
          [Op.not]: ["DRAFT", "PENDING_APROVAL"],
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: ["id", "status"],
    });
    if (!mutasi) {
      return [];
    }
    return Termin.findAll({
      where: {
        pegawai_id: mutasi.id,
      },
      include: [
        {
          association: "DokumenTermin",
        },
        {
          association: "Ref",
        },
      ],
    });
  }

  async getBiaya(nip: string) {
    return await this.findOne({
      where: {
        nip,
        status: {
          [Op.not]: ["DRAFT", "PENDING_APROVAL"],
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
        {
          association: "MonitoringTagihan",
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: [
        "id",
        [col("SuratKeputusan.tanggal"), "tanggal"],
        [col("SuratKeputusan.nomor"), "nomor"],
        "status",
        [col("MonitoringTagihan.total_tagihan"), "biaya"],
      ],
    });
  }

  async getHistory(nip: string) {
    const mutasi = await this.findOne({
      where: {
        nip,
        status: {
          [Op.not]: ["DRAFT"],
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: ["id", "status"],
    });
    if (!mutasi) {
      return [];
    }
    return PembayaranLog.findAll({
      where: {
        pegawai_id: mutasi.id,
      },
      attributes: {
        exclude: ["payload", "pegawai_id"],
      },
      order: [["created_at", "DESC"]],
    });
  }

  async getDataPerhitungan(nip: string, mutasiId: string, t?: Transaction) {
    return await this.findOne({
      where: {
        id: mutasiId,
        nip: nip,
        status: "PENDING_APROVAL",
      },
      include: [
        {
          association: "TanggunganDewasa",
        },
        {
          association: "TanggunganInvant",
        },
        {
          association: "Art",
        },
        {
          association: "KantorAsal",
          include: [
            {
              association: "Kota",
            },
          ],
        },
        {
          association: "KantorTujuan",
          include: [
            {
              association: "Kota",
            },
          ],
        },
      ],
      transaction: t,
    });
  }

  async getPegawaiWithStatus(id: string, skId?: string) {
    return await this.findById(id, {
      include: [
        {
          association: "SuratKeputusan",
          attributes: ["id", "nomor", "tanggal", "status"],
          where: {
            id: skId,
          },
        },
      ],
    });
  }

  async publish(id: string, t?: Transaction) {
    const data = await this.findById(id, {
      include: [
        {
          association: "MonitoringTagihan",
          attributes: ["id", "sisa_tagihan"],
        },
        {
          association: "SuratKeputusan",
          attributes: ["status"],
        },
      ],
      attributes: ["id", "nip", "process_keluarga", "process_biaya", "process_termin"],
    });

    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    if (data.SuratKeputusan.status !== "PUBLISH") {
      throw new AuthorizationError("Surat Keputusan tidak ada dalam status PUBLISH");
    }

    if (data.status !== "DRAFT") {
      throw new AuthorizationError("data sudah dalam proses");
    }
    if (
      data.process_keluarga !== "DONE" ||
      data.process_biaya !== "DONE" ||
      data.process_termin !== "DONE"
    ) {
      throw new AuthorizationError("Proses keluarga, biaya, dan termin belum selesai");
    }

    if (data.MonitoringTagihan.sisa_tagihan > 0) {
      throw new AuthorizationError("masih ada sisa tagihan yang belum dibuat rencana pembayaran");
    }

    data.status = "PENDING_APROVAL";
    await data.save({ transaction: t });

    return data;
  }
}

export type PegawaiMutasiType = PegawaiMutasi;
