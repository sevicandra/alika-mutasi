import { appConfig } from "@/config/app.config";
import sequelize from "@/config/db.config";
import { PegawaiMutasi } from "@/models";
import { biayaQueue } from "@/queues/Biaya.queue";
import {
  RefBarang,
  RefDarat,
  RefKapal,
  RefKota,
  RefPesawat,
  RefTarif,
  RefUangHarian,
} from "../models";
import { redisService } from "./redis-service";

export class BiayaMutasiService {
  private static async getRuteDarat(): Promise<RefDarat[]> {
    const redisKey = `${appConfig.NAME}:rute:darat`;
    const rute = await redisService.get<RefDarat[]>(redisKey);
    if (rute) {
      return rute;
    }
    const refDarat = await RefDarat.findAll({
      include: ["KotaAsal", "KotaTujuan"],
    });
    await redisService.setWithTimeout(redisKey, refDarat, 60 * 60 * 100);
    return refDarat;
  }

  private static async getRuteLaut(): Promise<RefKapal[]> {
    const redisKey = `${appConfig.NAME}:rute:kapal`;
    const rute = await redisService.get<RefKapal[]>(redisKey);
    if (rute) {
      return rute;
    }
    const refKapal = await RefKapal.findAll({
      include: ["KotaAsal", "KotaTujuan"],
    });
    await redisService.setWithTimeout(redisKey, refKapal, 60 * 60 * 100);
    return refKapal;
  }

  private static async getRutePesawat(): Promise<RefPesawat[]> {
    const redisKey = `${appConfig.NAME}:rute:pesawat`;
    const rute = await redisService.get<RefPesawat[]>(redisKey);
    if (rute) {
      return rute;
    }
    const refPesawat = await RefPesawat.findAll({
      include: ["KotaAsal", "KotaTujuan"],
    });
    await redisService.setWithTimeout(redisKey, refPesawat, 60 * 60 * 100);
    return refPesawat;
  }

  private static async getKota({ kode }: { kode: string }): Promise<RefKota> {
    const redisKey = `${appConfig.NAME}:kota:${kode}`;
    const kota = await redisService.get<RefKota>(redisKey);
    if (kota) {
      return kota;
    }
    const refKota = await RefKota.findOne({
      where: { kode },
    });
    if (!refKota) {
      throw new Error("Kota not found");
    }
    await redisService.setWithTimeout(redisKey, refKota, 60 * 60 * 100);
    return refKota;
  }

  static async getvolumeBarang({
    golongan,
    status,
  }: {
    golongan: string;
    status: "TIDAK_BERKELUARGA" | "BERKELUARGA_TANPA_ANAK" | "BERKELUARGA_DENGAN_ANAK";
  }): Promise<number> {
    const volume = await redisService.get<string>(
      `${appConfig.NAME}:volume_barang:${golongan}:${status}`
    );
    if (volume) {
      return Number(volume);
    }

    const refVolume = await RefBarang.findOne({
      where: {
        golongan: golongan,
        status: status,
      },
    });
    await redisService.setWithTimeout(
      `${appConfig.NAME}:volume_barang:${golongan}:${status}`,
      String(refVolume?.volume ?? 0),
      60 * 60 * 100
    );
    return refVolume?.volume ?? 0;
  }

  static async getUangHarian({ kode_provinsi }: { kode_provinsi: string }): Promise<{
    tarif: number;
    provinsi: string;
  }> {
    const redisKey = `${appConfig.NAME}:uang_harian:${kode_provinsi}`;
    const uangHarian = await redisService.get<{
      tarif: number;
      provinsi: string;
    }>(redisKey);
    if (uangHarian) {
      return uangHarian;
    }
    const refUangHarian = await RefUangHarian.findOne({
      where: {
        kode_provinsi,
      },
      include: [
        {
          association: "Provinsi",
        },
      ],
    });
    if (!refUangHarian) {
      throw new Error("Uang Harian not found");
    }
    await redisService.setWithTimeout(
      redisKey,
      {
        tarif: refUangHarian.tarif,
        provinsi: refUangHarian.Provinsi.provinsi,
      },
      60 * 60 * 100
    );
    return {
      tarif: refUangHarian.tarif,
      provinsi: refUangHarian.Provinsi.provinsi,
    };
  }

  static async getTarif({
    jenis,
  }: {
    jenis:
      | "PACKING_DARAT"
      | "PACKING_LAUT"
      | "TRANSPORT_DARAT_BARANG"
      | "TRANSPORT_DARAT_ORANG"
      | "UANG_HARIAN";
  }): Promise<number> {
    const redisKey = `${appConfig.NAME}:tarif:${jenis}`;
    const tarif = await redisService.get<string>(redisKey);
    if (tarif) {
      return Number(tarif);
    }
    const refTarif = await RefTarif.findOne({
      where: {
        jenis: jenis,
      },
    });
    if (!refTarif) {
      throw new Error("Tarif not found");
    }
    await redisService.setWithTimeout(redisKey, String(refTarif.tarif), 60 * 60 * 100);
    return refTarif.tarif;
  }

  static async RuteBarang({
    asal,
    tujuan,
    faktor_darat,
    faktor_laut,
  }: {
    asal: string;
    tujuan: string;
    faktor_darat: number;
    faktor_laut: number;
  }): Promise<{
    rute: {
      kota: string;
      moda: "KAPAL" | "TRUK" | null;
      biaya?: number | undefined;
      jarak: number;
      pulau: "JAWA" | "LUAR_JAWA" | null;
    }[];
    totalBiaya: number;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const graph: Record<
          string,
          {
            tujuan: string;
            biaya: number;
            moda: "KAPAL" | "TRUK";
            biayaBobot: number;
            jarak: number;
            pulau: "JAWA" | "LUAR_JAWA" | null;
          }[]
        > = {};
        const kota_asal = await this.getKota({ kode: asal });
        const kota_tujuan = await this.getKota({ kode: tujuan });
        if (!kota_asal || !kota_tujuan) {
          reject(new Error("Kota asal atau tujuan tidak ditemukan"));
          return;
        }

        const refDarat = await this.getRuteDarat();
        const refKapal = await this.getRuteLaut();
        const tarifDarat = await this.getTarif({
          jenis: "TRANSPORT_DARAT_BARANG",
        });
        refKapal.forEach(({ KotaAsal, KotaTujuan, tarif }) => {
          if (!graph[KotaAsal.kota]) graph[KotaAsal.kota] = [];
          graph[KotaAsal.kota].push({
            tujuan: KotaTujuan.kota,
            biaya: tarif,
            moda: "KAPAL",
            biayaBobot: tarif / faktor_laut,
            jarak: 0,
            pulau: null,
          });
        });
        refDarat.forEach(({ jarak, KotaAsal, KotaTujuan, pulau }) => {
          const faktor = faktor_darat as number;
          const biayaBobot = (jarak * tarifDarat) / faktor;
          if (!graph[KotaAsal.kota]) graph[KotaAsal.kota] = [];
          graph[KotaAsal.kota].push({
            tujuan: KotaTujuan.kota,
            biaya: tarifDarat * jarak,
            moda: "TRUK",
            biayaBobot: biayaBobot,
            jarak: jarak,
            pulau: pulau,
          });
          if (!graph[KotaTujuan.kota]) graph[KotaTujuan.kota] = [];
          graph[KotaTujuan.kota].push({
            tujuan: KotaAsal.kota,
            biaya: tarifDarat * jarak,
            moda: "TRUK",
            biayaBobot: biayaBobot,
            jarak: jarak,
            pulau: pulau,
          });
        });
        const biaya: Record<string, number> = {};
        const biayaBobot: Record<string, number> = {};
        const kapalCount: Record<string, number> = {};
        const trukCount: Record<string, number> = {};
        const score: Record<string, number> = {};
        const jalur: Record<
          string,
          {
            kota: string;
            moda: "KAPAL" | "TRUK" | null;
            biaya: number;
            jarak: number;
            pulau: "JAWA" | "LUAR_JAWA" | null;
            kapal: number;
            truk: number;
          } | null
        > = {};
        const queue: {
          kota: string;
          biaya: number;
          moda: "KAPAL" | "TRUK" | null;
          biayaBobot: number;
          kapal: number;
          truk: number;
          score: number;
        }[] = [];
        Object.keys(graph).forEach((kota) => {
          biaya[kota] = Infinity;
          biayaBobot[kota] = Infinity;
          jalur[kota] = null;
          trukCount[kota] = Infinity;
          kapalCount[kota] = Infinity;
          score[kota] = Infinity;
        });
        biaya[kota_asal.kota] = 0;
        biayaBobot[kota_asal.kota] = 0;
        trukCount[kota_asal.kota] = 0;
        kapalCount[kota_asal.kota] = 0;
        score[kota_asal.kota] = 0;
        queue.push({
          kota: kota_asal.kota,
          biaya: 0,
          moda: null,
          biayaBobot: 0,
          kapal: 0,
          truk: 0,
          score: 0,
        });
        while (queue.length > 0) {
          queue.sort((a, b) => b.score - a.score);
          const { kota, kapal, truk } = queue.shift()!;
          if (kota === kota_tujuan.kota) continue;

          for (const {
            tujuan: tujuanKota,
            biaya: harga,
            moda: jenis,
            biayaBobot: hargaBobot,
            jarak,
            pulau,
          } of graph[kota]) {
            const biayaBaru = biaya[kota] + harga;
            const biayaBobotBaru = biayaBobot[kota] + hargaBobot;
            const trukBaru = truk + (jenis === "TRUK" ? 1 : 0);
            const kapalBaru = kapal + (jenis === "KAPAL" ? 1 : 0);
            const scoreBaru = trukBaru * 100000 + kapalBaru * 50000 + biayaBobotBaru;
            if (scoreBaru < score[tujuanKota]) {
              biaya[tujuanKota] = biayaBaru;
              biayaBobot[tujuanKota] = biayaBobotBaru;
              trukCount[tujuanKota] = trukBaru;
              kapalCount[tujuanKota] = kapalBaru;
              score[tujuanKota] = scoreBaru;
              jalur[tujuanKota] = {
                kota,
                moda: jenis,
                biaya: harga,
                jarak: jarak,
                pulau: pulau,
                kapal: kapalBaru,
                truk: trukBaru,
              };
              queue.push({
                kota: tujuanKota,
                moda: jenis,
                biaya: biayaBaru,
                biayaBobot: biayaBobotBaru,
                kapal: kapalBaru,
                truk: trukBaru,
                score: scoreBaru,
              });
            }
          }
        }
        const rute: {
          kota: string;
          moda: "KAPAL" | "TRUK" | null;
          biaya?: number;
          jarak: number;
          pulau: "JAWA" | "LUAR_JAWA" | null;
        }[] = [];
        let current = kota_tujuan.kota;
        while (current && jalur[current]) {
          rute.unshift({
            kota: current,
            moda: jalur[current]!.moda,
            biaya: jalur[current]!.biaya,
            jarak: jalur[current]!.jarak,
            pulau: jalur[current]!.pulau,
          });
          current = jalur[current]!.kota;
        }
        if (rute.length > 0) {
          rute.unshift({
            kota: kota_asal.kota,
            moda: null,
            biaya: 0,
            jarak: 0,
            pulau: null,
          });
          resolve({ rute, totalBiaya: biaya[kota_tujuan.kota] });
        } else {
          reject({ message: "Rute Barang tidak ditemukan" });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  static async RuteOrang({
    kelas_pesawat = "EKONOMI",
    asal,
    tujuan,
    faktor_darat,
    faktor_udara,
  }: {
    kelas_pesawat?: "EKONOMI" | "BISNIS";
    asal: string;
    tujuan: string;
    faktor_darat: number;
    faktor_udara: number;
  }): Promise<{
    rute: {
      kota: string;
      moda: "BUS" | "PESAWAT" | null;
      biaya?: number | undefined;
    }[];
    totalBiaya: number;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const graph: Record<
          string,
          {
            tujuan: string;
            biaya: number;
            moda: "BUS" | "PESAWAT";
            biayaBobot: number;
          }[]
        > = {};
        const kota_asal = await this.getKota({ kode: asal });
        const kota_tujuan = await this.getKota({ kode: tujuan });
        if (!kota_asal || !kota_tujuan) {
          reject(new Error("Kota asal atau tujuan tidak ditemukan"));
          return;
        }

        const refDarat = await this.getRuteDarat();
        const refPesawat = await this.getRutePesawat();
        const tarifDarat = await this.getTarif({
          jenis: "TRANSPORT_DARAT_ORANG",
        });
        refPesawat.forEach(({ ekonomi, bisnis, KotaAsal, KotaTujuan }) => {
          let harga = 0;
          let faktor = faktor_udara as number;
          if (kelas_pesawat === "BISNIS") {
            harga = bisnis;
            faktor = faktor * 2;
          } else {
            harga = ekonomi;
          }
          if (!graph[KotaAsal.kota]) graph[KotaAsal.kota] = [];
          graph[KotaAsal.kota].push({
            tujuan: KotaTujuan.kota,
            biaya: harga,
            moda: "PESAWAT",
            biayaBobot: harga / faktor,
          });
          if (!graph[KotaTujuan.kota]) graph[KotaTujuan.kota] = [];
          graph[KotaTujuan.kota].push({
            tujuan: KotaAsal.kota,
            biaya: harga,
            moda: "PESAWAT",
            biayaBobot: harga / faktor,
          });
        });
        refDarat.forEach(({ jarak, KotaAsal, KotaTujuan }) => {
          const faktor = faktor_darat as number;
          const biayaBobot = (jarak * tarifDarat) / faktor;
          if (!graph[KotaAsal.kota]) graph[KotaAsal.kota] = [];
          graph[KotaAsal.kota].push({
            tujuan: KotaTujuan.kota,
            biaya: tarifDarat * jarak,
            moda: "BUS",
            biayaBobot: biayaBobot,
          });
          if (!graph[KotaTujuan.kota]) graph[KotaTujuan.kota] = [];
          graph[KotaTujuan.kota].push({
            tujuan: KotaAsal.kota,
            biaya: tarifDarat * jarak,
            moda: "BUS",
            biayaBobot: biayaBobot,
          });
        });
        const biaya: Record<string, number> = {};
        const biayaBobot: Record<string, number> = {};
        const pesawatCount: Record<string, number> = {};
        const busCount: Record<string, number> = {};
        const score: Record<string, number> = {};
        const jalur: Record<
          string,
          {
            kota: string;
            moda: "BUS" | "PESAWAT" | null;
            biaya: number;
            pesawat: number;
            bus: number;
          } | null
        > = {};
        const queue: {
          kota: string;
          biaya: number;
          moda: "BUS" | "PESAWAT" | null;
          biayaBobot: number;
          pesawat: number;
          bus: number;
          score: number;
        }[] = [];
        Object.keys(graph).forEach((kota) => {
          biaya[kota] = Infinity;
          biayaBobot[kota] = Infinity;
          jalur[kota] = null;
          pesawatCount[kota] = Infinity;
          busCount[kota] = Infinity;
          score[kota] = Infinity;
        });
        biaya[kota_asal.kota] = 0;
        biayaBobot[kota_asal.kota] = 0;
        pesawatCount[kota_asal.kota] = 0;
        busCount[kota_asal.kota] = 0;
        score[kota_asal.kota] = 0;
        queue.push({
          kota: kota_asal.kota,
          biaya: 0,
          moda: null,
          biayaBobot: 0,
          pesawat: 0,
          bus: 0,
          score: 0,
        });
        while (queue.length > 0) {
          queue.sort((a, b) => b.score - a.score);
          const { kota, pesawat, bus } = queue.shift()!;
          if (kota === kota_tujuan.kota) continue;

          for (const {
            tujuan: tujuanKota,
            biaya: harga,
            moda: jenis,
            biayaBobot: hargaBobot,
          } of graph[kota]) {
            const biayaBaru = biaya[kota] + harga;
            const biayaBobotBaru = biayaBobot[kota] + hargaBobot;
            const pesawatBaru = pesawat + (jenis === "PESAWAT" ? 1 : 0);
            const busBaru = bus + (jenis === "BUS" ? 1 : 0);
            const scoreBaru = busBaru * 100000 + pesawatBaru * 50000 + biayaBobotBaru;
            if (scoreBaru < score[tujuanKota]) {
              biaya[tujuanKota] = biayaBaru;
              biayaBobot[tujuanKota] = biayaBobotBaru;
              pesawatCount[tujuanKota] = pesawatBaru;
              busCount[tujuanKota] = busBaru;
              score[tujuanKota] = scoreBaru;
              jalur[tujuanKota] = {
                kota,
                moda: jenis,
                biaya: harga,
                pesawat: pesawatBaru,
                bus: busBaru,
              };
              queue.push({
                kota: tujuanKota,
                moda: jenis,
                biaya: biayaBaru,
                biayaBobot: biayaBobotBaru,
                pesawat: pesawatBaru,
                bus: busBaru,
                score: scoreBaru,
              });
            }
          }
        }
        const rute: {
          kota: string;
          moda: "BUS" | "PESAWAT" | null;
          biaya?: number;
        }[] = [];
        let current = kota_tujuan.kota;
        while (current && jalur[current]) {
          rute.unshift({
            kota: current,
            moda: jalur[current]!.moda,
            biaya: jalur[current]!.biaya,
          });
          current = jalur[current]!.kota;
        }
        if (rute.length > 0) {
          rute.unshift({ kota: kota_asal.kota, moda: null, biaya: 0 });
          resolve({ rute, totalBiaya: biaya[kota_tujuan.kota] });
        } else {
          reject({ message: "Rute Orang tidak ditemukan" });
        }
      } catch (e: any) {
        reject({ message: e.message });
      }
    });
  }
}

export class hitungBiayaJobService {
  static async addJob(pegawai_id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const t = await sequelize.transaction();
      try {
        const pegawai = await PegawaiMutasi.findByPk(pegawai_id, {
          include: [
            {
              association: "TanggunganDewasa",
              attributes: ["id"],
            },
            {
              association: "TanggunganInvant",
              attributes: ["id"],
            },
            {
              association: "Art",
              attributes: ["id"],
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
        });
        if (!pegawai) {
          throw new Error("Pegawai not found");
        }
        pegawai.process_biaya = "PROCESSING";
        await pegawai.save({ transaction: t });
        await biayaQueue.add(
          "biaya",
          {
            pegawai_id,
            jumlah_tanggungan_dewasa: pegawai.TanggunganDewasa.length,
            jumlah_tanggungan_invant: pegawai.TanggunganInvant.length,
            tanggungan_art: pegawai.Art ? true : false,
            asal: pegawai.KantorAsal.Kota.kode,
            tujuan: pegawai.KantorTujuan.Kota.kode,
            provinsi_tujuan: pegawai.KantorTujuan.Kota.kode_provinsi,
            faktor_darat: pegawai.faktor_darat,
            faktor_laut: pegawai.faktor_laut,
            faktor_udara: pegawai.faktor_udara,
            kelas_pesawat: pegawai.kelas_pesawat,
            golongan: pegawai.golongan.split("")[0] as "1" | "2" | "3" | "4",
            jumlah_hari: pegawai.jumlah_hari,
            nip: pegawai.nip,
          },
          {
            jobId: pegawai_id,
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        await t.commit();
        resolve();
      } catch (error) {
        await t.rollback();
        console.error("Error adding job to hitung biaya queue:", error);
        reject("Failed to add job to hitung biaya queue");
      }
    });
  }

  static async addBatchJob(pegawaiIds: string[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const jobs: any[] = [];
        for (const pegawai_id of pegawaiIds) {
          const t = await sequelize.transaction();
          const pegawai = await PegawaiMutasi.findByPk(pegawai_id, {
            include: [
              {
                association: "TanggunganDewasa",
                attributes: ["id"],
              },
              {
                association: "TanggunganInvant",
                attributes: ["id"],
              },
              {
                association: "Art",
                attributes: ["id"],
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
          });
          if (!pegawai) {
            throw new Error("Pegawai not found");
          }
          pegawai.process_biaya = "PROCESSING";
          await pegawai.save({ transaction: t });
          await biayaQueue.add(
            "biaya",
            {
              pegawai_id,
              jumlah_tanggungan_dewasa: pegawai.TanggunganDewasa.length,
              jumlah_tanggungan_invant: pegawai.TanggunganInvant.length,
              tanggungan_art: pegawai.Art ? true : false,
              asal: pegawai.KantorAsal.Kota.kode,
              tujuan: pegawai.KantorTujuan.Kota.kode,
              provinsi_tujuan: pegawai.KantorTujuan.Kota.kode_provinsi,
              faktor_darat: pegawai.faktor_darat,
              faktor_laut: pegawai.faktor_laut,
              faktor_udara: pegawai.faktor_udara,
              kelas_pesawat: pegawai.kelas_pesawat,
              golongan: pegawai.golongan.split("")[0] as "1" | "2" | "3" | "4",
              jumlah_hari: pegawai.jumlah_hari,
              nip: pegawai.nip,
            },
            {
              jobId: pegawai_id,
              attempts: 3,
              backoff: { type: "exponential", delay: 1000 },
              removeOnComplete: true,
              removeOnFail: false,
            }
          );
          await t.commit();
        }
        await Promise.all(jobs);
        resolve();
      } catch (error) {
        reject("Failed to add batch job to hitung biaya queue");
        console.error("Error adding batch job to hitung biaya queue:", error);
      }
    });
  }
}
