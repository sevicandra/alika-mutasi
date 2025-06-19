import { terminQueue } from "@/queues/Termin.queue";
import { PegawaiMutasi } from "@/models";
import sequelize from "@/config/db.config";

export class terminJobService {
  static async addJob({
    id,
    type,
    tahun_uang_muka,
    tahun_lunas,
    percentage,
    maximum,
  }:
    | {
        id: string;
        type: "UANG_MUKA";
        tahun_uang_muka: string;
        tahun_lunas: string;
        percentage: number;
        maximum: number;
      }
    | {
        id: string;
        type: "LUNAS";
        tahun_uang_muka: string;
        tahun_lunas: string;
        percentage?: never;
        maximum?: never;
      }): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const Pegawai = await PegawaiMutasi.findByPk(id, {
        include: [
          {
            association: "MonitoringTagihan",
          },
        ],
      });
      if (!Pegawai) {
        throw new Error("Pegawai not found");
      }
      Pegawai.process_termin = "PROCESSING";
      await Pegawai.save({ transaction: t });
      let nominal: number;
      if (type === "UANG_MUKA") {
        nominal = Math.floor(
          Pegawai.MonitoringTagihan.total_tagihan * (percentage / 100)
        );

        if (maximum) {
          nominal = Math.min(nominal, maximum);
        }
      } else {
        nominal = Pegawai.MonitoringTagihan.total_tagihan;
      }

      await terminQueue.add(
        "termin",
        {
          pegawai_id: id,
          nominal,
          tahun_uang_muka,
          tahun_lunas,
          type,
        },
        {
          jobId: id,
          attempts: 1,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: true,
        }
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      console.error("Error requesting Profil:", error);
      throw new Error("Failed to get Profil");
    }
  }

  static async addBatchJobs(
    jobs:
      | {
          id: string;
          type: "UANG_MUKA";
          tahun_uang_muka: string;
          tahun_lunas: string;
          percentage: number;
          maximum: number;
        }[]
      | {
          id: string;
          type: "LUNAS";
          tahun_uang_muka: string;
          tahun_lunas: string;
        }[]
  ): Promise<void> {
    for (const job of jobs) {
      await this.addJob(job);
    }
  }
}
