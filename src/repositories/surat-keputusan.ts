import { FindOptions, Transaction } from "sequelize";
import { AuthorizationError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { SuratKeputusan } from "@/models";
import { BaseRepository } from "./base-repository";

export class SuratKeputusanRepository extends BaseRepository<SuratKeputusan> {
  constructor() {
    super(SuratKeputusan);
  }

  async getPegawai(id: string, t?: Transaction) {
    const data = await this.findById(id, {
      include: [
        {
          association: "Pegawai",
        },
      ],
      transaction: t,
    });
    if (!data) {
      throw new InvalidRequestError("Invalid request");
    }
    return data.Pegawai;
  }

  async processKeluarga(id: string, t?: Transaction) {
    const data = await this.findById(id, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "IDLE",
            status: "DRAFT",
          },
        },
      ],
      transaction: t,
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    if (data.status !== "DRAFT") {
      throw new AuthorizationError("Surat Keputusan tidak dalam status DRAFT");
    }
    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      throw new NotFoundError("Tidak ada pegawai yang dapat diproses");
    }
    return ids;
  }

  async hitungBiaya(id: string, t?: Transaction) {
    const data = await this.findById(id, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "DONE",
            process_biaya: "IDLE",
            status: "DRAFT",
          },
        },
      ],
      transaction: t,
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    if (data.status !== "DRAFT") {
      throw new AuthorizationError("Surat Keputusan tidak dalam status DRAFT");
    }
    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      throw new NotFoundError("Tidak ada pegawai yang dapat diproses");
    }
    return ids;
  }

  async processTermin(id: string, t?: Transaction) {
    const data = await SuratKeputusan.findByPk(id, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id"],
          where: {
            process_keluarga: "DONE",
            process_biaya: "DONE",
            process_termin: "IDLE",
            status: "DRAFT",
          },
        },
      ],
      transaction: t,
    });
    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    if (data.status !== "DRAFT") {
      throw new AuthorizationError("Surat Keputusan tidak dalam status DRAFT");
    }
    const ids = data.Pegawai.map((pegawai) => pegawai.id);
    if (ids.length === 0) {
      throw new NotFoundError("Tidak ada pegawai yang dapat diproses");
    }
    return ids;
  }

  async publish(id: string, t?: Transaction) {
    const data = await SuratKeputusan.findByPk(id, {
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nip", "process_keluarga", "process_biaya", "process_termin"],
          include: [
            {
              association: "MonitoringTagihan",
            },
          ],
        },
        {
          association: "Timeline",
        },
      ],
    });

    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }

    if (data.status !== "DRAFT") {
      throw new AuthorizationError("Surat Keputusan tidak dalam status DRAFT");
    }

    if (
      data.Pegawai.some(
        (pegawai) =>
          pegawai.process_keluarga !== "DONE" ||
          pegawai.process_biaya !== "DONE" ||
          pegawai.process_termin !== "DONE"
      )
    ) {
      throw new AuthorizationError("Proses keluarga, biaya, dan termin belum selesai");
    }

    if (data.Pegawai.some((pegawai) => pegawai.MonitoringTagihan.sisa_tagihan > 0)) {
      throw new AuthorizationError("masih ada sisa tagihan yang belum dibuat rencana pembayaran");
    }

    if (
      !data.Timeline.find((timeline) => timeline.ref_kode === "01") ||
      !data.Timeline.find((timeline) => timeline.ref_kode === "02") ||
      !data.Timeline.find((timeline) => timeline.ref_kode === "03")
    ) {
      throw new AuthorizationError("Surat Keputusan belum memiliki timeline lengkap");
    }

    data.status = "PUBLISH";
    await data.save({ transaction: t });

    return data;
  }

  async getOverview(options?: Omit<FindOptions<SuratKeputusan>, "include">) {
    const data = await SuratKeputusan.findOne({
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "Golongan",
            },
            {
              association: "Keluarga",
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
              association: "Termin",
              include: [
                {
                  association: "Ref",
                },
              ],
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
            {
              association: "MonitoringTagihan",
            },
          ],
        },
      ],
      ...options,
    });

    if (!data) {
      throw new NotFoundError("data tidak ditemukan");
    }
    const { Pegawai } = data;
    const totalBiaya = Pegawai.reduce((acc, pegawai) => {
      return acc + pegawai.MonitoringTagihan.total_tagihan;
    }, 0);
    const biayaTertinggi = Pegawai.reduce((max, pegawai) => {
      return pegawai.MonitoringTagihan.total_tagihan > max
        ? pegawai.MonitoringTagihan.total_tagihan
        : max;
    }, 0);
    const biayaTerendah = Pegawai.reduce((min, pegawai) => {
      return pegawai.MonitoringTagihan.total_tagihan < min
        ? pegawai.MonitoringTagihan.total_tagihan
        : min;
    }, Number.MAX_VALUE);
    const rataRataBiaya = Pegawai.length > 0 ? totalBiaya / Pegawai.length : 0;

    const nilaiTermin: {
      nama: string;
      nominal: number;
    }[] = Pegawai.flatMap((pegawai) =>
      pegawai.Termin.map((termin) => ({
        nama: termin.Ref.nama,
        nominal: termin.nominal,
      }))
    );

    const aggregatedNilaiTermin: { [key: string]: number } = {};
    nilaiTermin.forEach((item) => {
      if (aggregatedNilaiTermin[item.nama]) {
        aggregatedNilaiTermin[item.nama] += item.nominal;
      } else {
        aggregatedNilaiTermin[item.nama] = item.nominal;
      }
    });

    const finalNilaiTermin = Object.keys(aggregatedNilaiTermin).map((nama) => ({
      nama,
      nominal: aggregatedNilaiTermin[nama],
    }));

    const summary = {
      total_pegawai: Pegawai.length,
      total_biaya: totalBiaya,
      biaya_tertinggi: biayaTertinggi,
      biaya_terendah: biayaTerendah === Number.MAX_VALUE ? 0 : biayaTerendah,
      rata_rata_biaya: rataRataBiaya,
      nilai_termin: finalNilaiTermin,
    };

    return { data, summary };
  }

}

export type SuratKeputusanType = SuratKeputusan;