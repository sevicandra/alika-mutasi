import dotenv from "dotenv";
import { BaseQueueWorker } from "@/bullmq/base-queue-worker";
import sequelize from "@/config/db.config";
import { MonitoringTagihan, PegawaiMutasi, Termin } from "@/models";
import { TerminJob } from "@/types/Job";

dotenv.config();

export const TerminWorker = new BaseQueueWorker<TerminJob>("termin", (job) => {
  return new Promise(async (resolve, reject) => {
    const t = await sequelize.transaction();
    const { pegawai_id, nominal, tahun_lunas, tahun_uang_muka, type } = job.data;
    try {
      const tagihan = await MonitoringTagihan.findByPk(pegawai_id);
      const pegawai = await PegawaiMutasi.findByPk(pegawai_id);

      if (!tagihan || !pegawai) {
        reject(new Error("Tagihan tidak ditemukan"));
        return;
      }

      pegawai.process_termin = "DONE";
      await pegawai.save({ transaction: t });
      if (tagihan.total_tagihan === 0) {
        await t.commit();
        resolve();
        return;
      }

      if (type === "UANG_MUKA") {
        await Termin.bulkCreate(
          [
            {
              pegawai_id,
              tahun: tahun_uang_muka,
              ref_termin: "01",
              nominal,
            },
            {
              pegawai_id,
              tahun: tahun_lunas,
              ref_termin: "02",
              nominal: tagihan.total_tagihan - nominal,
            },
          ],
          {
            transaction: t,
          }
        );
      } else {
        await Termin.create(
          {
            pegawai_id,
            tahun: tahun_lunas,
            ref_termin: "03",
            nominal,
          },
          {
            transaction: t,
          }
        );
      }

      await t.commit();
      resolve();
    } catch (error) {
      await t.rollback();
      console.error("Job gagal, percobaan ke:", job.attemptsMade + 1);

      if (job.attemptsMade >= 2) {
        await PegawaiMutasi.update({ process_termin: "FAILED" }, { where: { id: pegawai_id } });
        console.log("Job gagal maksimal, status diubah ke failed.");
      }
      reject(error);
    }
  });
});
