import sequelize from "sequelize";
import { Logger } from "@/services/log.service";
import { ApproveMutasiQueue } from "@/bullmq/queues/approve-mutasi";
import { PegawaiMutasi, SpdCounter } from "@/models";

export class ApproveMutasi {
  static async addJob(pegawai_id: string, t: sequelize.Transaction): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const [counter] = await SpdCounter.findOrCreate({
          where: { year: `${new Date().getFullYear()}` },
          defaults: {
            ext: "KN.122",
          },
          transaction: t,
        });

        counter.last_number += 1;
        await counter.save({ transaction: t });

        const data = await PegawaiMutasi.findOne({
          where: {
            id: pegawai_id,
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
        if (!data) {
          throw new Error("data tidak ditemukan");
        }
        data.status = "CALCULATING";
        ((data.nomor_spd = `${String(counter.last_number).padStart(4, "0")}/${
          counter.ext
        }/${new Date().getFullYear()}`),
          (data.tanggal_spd = new Date()));

        await data.save({ transaction: t });
        await ApproveMutasiQueue.addJob(
          "approve_mutasi",
          {
            nip: data.nip,
            agenda: {
              nomor: `${String(counter.last_number).padStart(4, "0")}/${
                counter.ext
              }/${new Date().getFullYear()}`,
              tanggal: new Date().toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "2-digit",
              }),
            },
            pegawai_id: pegawai_id,
            jumlah_tanggungan_dewasa: data.TanggunganDewasa.length,
            jumlah_tanggungan_invant: data.TanggunganInvant.length,
            tanggungan_art: data.Art ? true : false,
            asal: data.KantorAsal.Kota.kode,
            tujuan: data.KantorTujuan.Kota.kode,
            provinsi_tujuan: data.KantorTujuan.Kota.kode_provinsi,
            faktor_darat: data.faktor_darat,
            faktor_laut: data.faktor_laut,
            faktor_udara: data.faktor_udara,
            kelas_pesawat: data.kelas_pesawat,
            golongan: data.golongan.split("")[0] as "1" | "2" | "3" | "4",
            jumlah_hari: data.jumlah_hari,
          },
          pegawai_id
        );
        await Logger.GeneralAction({
          pegawai_id: pegawai_id,
          actor_nip: null,
          actor_role: "SYSTEM",
          action: "Setujui Data Tanggungan Mutasi",
          description: null,
          transaction: t,
        });
        resolve();
      } catch (error) {
        reject("Failed to add job to approve mutasi queue");
        console.error("Error adding job to approve mutasi queue:", error);
      }
    });
  }

  static async addBatchJob(pegawaiIds: string[], t: sequelize.Transaction): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const jobs: any[] = [];
        for (const pegawai_id of pegawaiIds) {
          const [counter] = await SpdCounter.findOrCreate({
            where: { year: `${new Date().getFullYear()}` },
            defaults: {
              ext: "KN.122",
            },
            transaction: t,
          });

          counter.last_number += 1;
          await counter.save({ transaction: t });

          const data = await PegawaiMutasi.findOne({
            where: {
              id: pegawai_id,
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
          if (!data) {
            throw new Error("data tidak ditemukan");
          }
          data.status = "CALCULATING";
          ((data.nomor_spd = `${String(counter.last_number).padStart(4, "0")}/${
            counter.ext
          }/${new Date().getFullYear()}`),
            (data.tanggal_spd = new Date()));

          await data.save({ transaction: t });
          await ApproveMutasiQueue.addJob(
            "approve_mutasi",
            {
              nip: data.nip,
              agenda: {
                nomor: `${String(counter.last_number).padStart(4, "0")}/${
                  counter.ext
                }/${new Date().getFullYear()}`,
                tanggal: new Date().toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                }),
              },
              pegawai_id: pegawai_id,
              jumlah_tanggungan_dewasa: data.TanggunganDewasa.length,
              jumlah_tanggungan_invant: data.TanggunganInvant.length,
              tanggungan_art: data.Art ? true : false,
              asal: data.KantorAsal.Kota.kode,
              tujuan: data.KantorTujuan.Kota.kode,
              provinsi_tujuan: data.KantorTujuan.Kota.kode_provinsi,
              faktor_darat: data.faktor_darat,
              faktor_laut: data.faktor_laut,
              faktor_udara: data.faktor_udara,
              kelas_pesawat: data.kelas_pesawat,
              golongan: data.golongan.split("")[0] as "1" | "2" | "3" | "4",
              jumlah_hari: data.jumlah_hari,
            },
            pegawai_id
          );
          await Logger.GeneralAction({
            pegawai_id: pegawai_id,
            actor_nip: null,
            actor_role: "SYSTEM",
            action: "Setujui Data Tanggungan Mutasi",
            description: null,
            transaction: t,
          });
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
