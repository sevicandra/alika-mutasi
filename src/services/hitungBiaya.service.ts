import {
  RefDarat,
  RefKapal,
  RefTarif,
  RefPesawat,
  RefBarang,
  RefUangHarian,
  RefKota,
} from "../models";
import { RedisService } from "./redis.service";
import { appConfig } from "@/config/app.config";
const redisService = new RedisService();
import { biayaQueue } from "@/queues/Biaya.queue";
import { PegawaiMutasi } from "@/models";
import sequelize from "@/config/db.config";

export class BiayaMutasiService {
  private static async getRuteDarat(): Promise<RefDarat[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const redisKey = `${appConfig.name}:rute:darat`;
        const rute = await redisService.getCache(redisKey);
        if (rute) {
          resolve(JSON.parse(rute) as RefDarat[]);
        }
        const refDarat = await RefDarat.findAll({
          include: ["KotaAsal", "KotaTujuan"],
        });
        await redisService.setCache(redisKey, JSON.stringify(refDarat), 300);
        resolve(refDarat);
      } catch (error) {
        console.error("Error requesting Rute Darat:", error);
        reject("Failed to get Rute Darat");
      }
    });
  }

  private static async getRuteLaut(): Promise<RefKapal[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const redisKey = `${appConfig.name}:rute:kapal`;
        const rute = await redisService.getCache(redisKey);
        if (rute) {
          resolve(JSON.parse(rute) as RefKapal[]);
        }
        const refKapal = await RefKapal.findAll({
          include: ["KotaAsal", "KotaTujuan"],
        });
        await redisService.setCache(redisKey, JSON.stringify(refKapal), 300);
        resolve(refKapal);
      } catch (error) {
        console.error("Error requesting Rute Kapal:", error);
        reject("Failed to get Rute Kapal");
      }
    });
  }

  private static async getRutePesawat(): Promise<RefPesawat[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const redisKey = `${appConfig.name}:rute:pesawat`;
        const rute = await redisService.getCache(redisKey);
        if (rute) {
          resolve(JSON.parse(rute) as RefPesawat[]);
        }
        const refPesawat = await RefPesawat.findAll({
          include: ["KotaAsal", "KotaTujuan"],
        });
        await redisService.setCache(redisKey, JSON.stringify(refPesawat), 300);
        resolve(refPesawat);
      } catch (error) {
        console.error("Error requesting Rute Pesawat:", error);
        reject("Failed to get Rute Pesawat");
      }
    });
  }

  private static async getKota({ kode }: { kode: string }): Promise<RefKota> {
    return new Promise(async (resolve, reject) => {
      try {
        const redisKey = `${appConfig.name}:kota:${kode}`;
        const kota = await redisService.getCache(redisKey);
        if (kota) {
          resolve(JSON.parse(kota) as RefKota);
        }
        const refKota = await RefKota.findOne({
          where: { kode },
        });
        if (!refKota) {
          reject(new Error("Kota tidak ditemukan"));
          return;
        }
        await redisService.setCache(redisKey, JSON.stringify(refKota), 300);
        resolve(refKota);
      } catch (error) {
        console.error("Error requesting Kota:", error);
        reject("Failed to get Kota");
      }
    });
  }

  static async getvolumeBarang({
    golongan,
    status,
  }: {
    golongan: string;
    status:
      | "TIDAK_BERKELUARGA"
      | "BERKELUARGA_TANPA_ANAK"
      | "BERKELUARGA_DENGAN_ANAK";
  }): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const volume = await redisService.getCache(
        `${appConfig.name}:volume_barang:${golongan}:${status}`
      );
      if (volume) {
        resolve(Number(volume));
        return;
      }
      try {
        const refVolume = await RefBarang.findOne({
          where: {
            golongan: golongan,
            status: status,
          },
        });
        await redisService.setCache(
          `${appConfig.name}:volume_barang:${golongan}:${status}`,
          String(refVolume?.volume ?? 0),
          60
        );
        resolve(refVolume?.volume ?? 0);
      } catch (error: any) {
        reject(error.message);
      }
    });
  }

  static async getUangHarian({
    kode_provinsi,
  }: {
    kode_provinsi: string;
  }): Promise<{
    tarif: number;
    provinsi: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const redisKey = `${appConfig.name}:uang_harian:${kode_provinsi}`;
        const uangHarian = await redisService.getCache(redisKey);
        if (uangHarian) {
          resolve(
            JSON.parse(uangHarian) as {
              tarif: number;
              provinsi: string;
            }
          );
          return;
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
          reject(new Error("Uang harian tidak ditemukan"));
          return;
        }
        await redisService.setCache(
          redisKey,
          JSON.stringify({
            tarif: refUangHarian.tarif,
            provinsi: refUangHarian.Provinsi.provinsi,
          }),
          60 * 5
        );
        resolve({
          tarif: refUangHarian.tarif,
          provinsi: refUangHarian.Provinsi.provinsi,
        });
      } catch (error: any) {
        reject(error.message);
      }
    });
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
    return new Promise(async (resolve, reject) => {
      try {
        const redisKey = `${appConfig.name}:tarif:${jenis}`;
        const tarif = await redisService.getCache(redisKey);
        if (tarif) {
          resolve(Number(tarif));
          return;
        }
        const refTarif = await RefTarif.findOne({
          where: {
            jenis: jenis,
          },
        });
        if (!refTarif) {
          reject(new Error(`Tarif untuk jenis ${jenis} tidak ditemukan`));
          return;
        }
        await redisService.setCache(redisKey, String(refTarif.tarif), 60 * 5);
        resolve(refTarif?.tarif ?? 0);
      } catch (error: any) {
        reject(error.message);
      }
    });
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
          });
          if (!graph[KotaTujuan.kota]) graph[KotaTujuan.kota] = [];
          graph[KotaAsal.kota].push({
            tujuan: KotaAsal.kota,
            biaya: tarif,
            moda: "KAPAL",
            biayaBobot: tarif / faktor_laut,
          });
        });
        refDarat.forEach(({ jarak, KotaAsal, KotaTujuan }) => {
          const faktor = faktor_darat as number;
          const biayaBobot = (jarak * tarifDarat) / faktor;
          if (!graph[KotaAsal.kota]) graph[KotaAsal.kota] = [];
          graph[KotaAsal.kota].push({
            tujuan: KotaTujuan.kota,
            biaya: tarifDarat * jarak,
            moda: "TRUK",
            biayaBobot: biayaBobot,
          });
          if (!graph[KotaTujuan.kota]) graph[KotaTujuan.kota] = [];
          graph[KotaTujuan.kota].push({
            tujuan: KotaAsal.kota,
            biaya: tarifDarat * jarak,
            moda: "TRUK",
            biayaBobot: biayaBobot,
          });
        });
        const biaya: Record<string, number> = {};
        const transitCount: Record<string, number> = {};
        const biayaBobot: Record<string, number> = {};
        const jalur: Record<
          string,
          {
            kota: string;
            moda: "KAPAL" | "TRUK" | null;
            biaya: number;
            transit: number;
          } | null
        > = {};
        const queue: {
          kota: string;
          biaya: number;
          moda: "KAPAL" | "TRUK" | null;
          biayaBobot: number;
          transit: number;
        }[] = [];
        Object.keys(graph).forEach((kota) => {
          biaya[kota] = Infinity;
          biayaBobot[kota] = Infinity;
          jalur[kota] = null;
          transitCount[kota] = Infinity;
        });
        biaya[kota_asal.kota] = 0;
        transitCount[kota_asal.kota] = 0;
        biayaBobot[kota_asal.kota] = 0;
        queue.push({
          kota: kota_asal.kota,
          biaya: 0,
          moda: null,
          biayaBobot: 0,
          transit: 0,
        });
        while (queue.length > 0) {
          queue.sort(
            (a, b) => a.transit - b.transit || a.biayaBobot - b.biayaBobot
          );
          const { kota, moda: modaSebelumnya, transit } = queue.shift()!;
          if (kota === kota_tujuan.kota) continue;

          for (const {
            tujuan: tujuanKota,
            biaya: harga,
            moda: jenis,
            biayaBobot: hargaBobot,
          } of graph[kota]) {
            const biayaBaru = biaya[kota] + harga;
            const biayaBobotBaru = biayaBobot[kota] + hargaBobot;
            const transitBaru =
              transit + (modaSebelumnya !== null && harga !== 0 ? 1 : 0);

            if (
              transitBaru < transitCount[tujuanKota] ||
              (transitBaru === transitCount[tujuanKota] &&
                biayaBobotBaru < biayaBobot[tujuanKota])
            ) {
              biaya[tujuanKota] = biayaBaru;
              biayaBobot[tujuanKota] = biayaBobotBaru;
              transitCount[tujuanKota] = transitBaru;
              jalur[tujuanKota] = {
                kota,
                moda: jenis,
                biaya: harga,
                transit: transitBaru,
              };
              queue.push({
                kota: tujuanKota,
                moda: jenis,
                biaya: biayaBaru,
                biayaBobot: biayaBobotBaru,
                transit: transitBaru,
              });
            }
          }
        }
        const rute: {
          kota: string;
          moda: "KAPAL" | "TRUK" | null;
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
        const transitCount: Record<string, number> = {};
        const biayaBobot: Record<string, number> = {};
        const pesawatCount: Record<string, number> = {};

        const jalur: Record<
          string,
          {
            kota: string;
            moda: "BUS" | "PESAWAT" | null;
            biaya: number;
            transit: number;
            pesawat: number;
          } | null
        > = {};
        const queue: {
          kota: string;
          biaya: number;
          moda: "BUS" | "PESAWAT" | null;
          biayaBobot: number;
          transit: number;
          pesawat: number;
        }[] = [];
        Object.keys(graph).forEach((kota) => {
          biaya[kota] = Infinity;
          biayaBobot[kota] = Infinity;
          jalur[kota] = null;
          transitCount[kota] = Infinity;
          pesawatCount[kota] = Infinity;
        });
        biaya[kota_asal.kota] = 0;
        transitCount[kota_asal.kota] = 0;
        biayaBobot[kota_asal.kota] = 0;
        pesawatCount[kota_asal.kota] = 0;
        queue.push({
          kota: kota_asal.kota,
          biaya: 0,
          moda: null,
          biayaBobot: 0,
          transit: 0,
          pesawat: 0,
        });
        while (queue.length > 0) {
          queue.sort(
            (a, b) =>
              a.transit - b.transit ||
              a.pesawat - b.pesawat ||
              a.biayaBobot - b.biayaBobot
          );
          const {
            kota,
            moda: modaSebelumnya,
            transit,
            pesawat,
          } = queue.shift()!;
          if (kota === kota_tujuan.kota) continue;

          for (const {
            tujuan: tujuanKota,
            biaya: harga,
            moda: jenis,
            biayaBobot: hargaBobot,
          } of graph[kota]) {
            const biayaBaru = biaya[kota] + harga;
            const biayaBobotBaru = biayaBobot[kota] + hargaBobot;
            const transitBaru =
              transit + (modaSebelumnya !== null && jenis === "BUS" ? 1 : 0);
            const pesawatBaru =
              pesawat +
              (modaSebelumnya !== null && jenis === "PESAWAT" ? 1 : 0);

            if (
              transitBaru < transitCount[tujuanKota] ||
              (transitBaru === transitCount[tujuanKota] &&
                pesawatBaru < pesawatCount[tujuanKota]) ||
              (transitBaru === transitCount[tujuanKota] &&
                pesawatBaru === pesawatCount[tujuanKota] &&
                biayaBobotBaru < biayaBobot[tujuanKota])
            ) {
              biaya[tujuanKota] = biayaBaru;
              biayaBobot[tujuanKota] = biayaBobotBaru;
              transitCount[tujuanKota] = transitBaru;
              pesawatCount[tujuanKota] = pesawatBaru;
              jalur[tujuanKota] = {
                kota,
                moda: jenis,
                biaya: harga,
                transit: transitBaru,
                pesawat: pesawatBaru,
              };
              queue.push({
                kota: tujuanKota,
                moda: jenis,
                biaya: biayaBaru,
                biayaBobot: biayaBobotBaru,
                transit: transitBaru,
                pesawat: pesawatBaru,
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
