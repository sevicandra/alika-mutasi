import { KeluargaQueue } from "@/bullmq/queues/keluarga";
import sequelize from "@/config/db.config";
import { PegawaiMutasi } from "@/models";

export class KeluargaJobService {
  static async addJob(id: string): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const Pegawai = await PegawaiMutasi.findByPk(id);
      if (!Pegawai) {
        throw new Error("Pegawai not found");
      }
      await Pegawai.update({ process_keluarga: "PROCESSING" }, { transaction: t });
      await KeluargaQueue.addJob("keluarga", { pegawaiId: Pegawai.id }, Pegawai.id, {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
      await t.commit();
    } catch (error) {
      await t.rollback();
      console.error("Error requesting Profil:", error);
      throw new Error("Failed to get Profil");
    }
  }

  static async addBatchJob(ids: string[]): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const Pegawai = await PegawaiMutasi.findAll({
        where: { id: ids },
      });
      if (!Pegawai || Pegawai.length === 0) {
        throw new Error("Pegawai not found");
      }
      for (const item of Pegawai) {
        await item.update({ process_keluarga: "PROCESSING" }, { transaction: t });
        await KeluargaQueue.addJob("keluarga", { pegawaiId: item.id }, item.id, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        });
      }
      await t.commit();
    } catch (error) {
      await t.rollback();
      console.error("Error requesting Profil:", error);
      throw new Error("Failed to get Profil");
    }
  }
}
