import { Job } from "bull";
import { PegawaiJob } from "@/types/Job";
import sequelize from "@/config/db.config";
import { KemenkeuService } from "@/services/kemenkeu.service";
import { Invant, Adult } from "@/helpers/age.helper";
import {
  RefHubunganKeluarga,
  PegawaiMutasi,
  Keluarga,
} from "@/models";
import dotenv from "dotenv";
dotenv.config();

export const processKeluarga = async (job: Job<PegawaiJob>): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const t = await sequelize.transaction();
    const { id } = job.data;
    try {
      const Pegawai = await PegawaiMutasi.findByPk(id, {
        include: [{ association: "SuratKeputusan" }],
      });
      if (!Pegawai) {
        throw new Error("Pegawai not found");
      }
      const keluarga = await KemenkeuService.getKeluarga({ nip: Pegawai.nip });
      const pasangan = await RefHubunganKeluarga.scope("pasangan").findAll({
        attributes: ["kode", "jenis"],
      });
      const anak = await RefHubunganKeluarga.scope("anak").findAll({
        attributes: ["kode", "jenis"],
      });

      const dataPasangan = keluarga
        .filter((item) =>
          pasangan.some((hub) => hub.kode === item.IdrefHubungan)
        )
        .map((item) => {
          return {
            pegawai_id: id,
            hris_id: item.IdpegawaiKeluarga,
            nama: item.Nama,
            hubungan: item.IdrefHubungan,
            tanggal_lahir: new Date(item.TanggalLahir),
            pekerjaan: item.Pekerjaan,
            status:
              !item.StatusTanggungan === null ||
              item.StatusTanggungan === "Tidak Tertanggung" ||
              item.Pekerjaan === "PNS Kemenkeu"
                ? "TIDAK_TERTANGGUNG"
                : "TERTANGGUNG",
            is_invant: false,
          };
        });
      const dataAnak = keluarga
        .filter((item) => anak.some((hub) => hub.kode === item.IdrefHubungan))
        .map((item) => {
          const tanggungan = keluarga.filter(
            (kel) => kel.StatusTanggungan === "Tertanggung"
          );
          const invant = Invant(
            item.TanggalLahir,
            Pegawai.SuratKeputusan.tanggal
          );
          const adult = Adult(
            item.TanggalLahir,
            Pegawai.SuratKeputusan.tanggal
          );
          return {
            pegawai_id: id,
            hris_id: item.IdpegawaiKeluarga,
            nama: item.Nama,
            hubungan: item.IdrefHubungan,
            tanggal_lahir: item.TanggalLahir,
            pekerjaan: item.Pekerjaan,
            is_invant: invant,
            status:
              tanggungan.length > 0 && !adult
                ? "TERTANGGUNG"
                : "TIDAK_TERTANGGUNG",
          };
        });

      const data = [...dataPasangan, ...dataAnak];

      await Keluarga.bulkCreate(data, { transaction: t });
      // await PerubahanKeluarga.create(
      //   {
      //     pegawai_id: id,
      //     changed_field: JSON.parse(JSON.stringify(result)),
      //     changed_by: "SYSTEM",
      //     changed_at: new Date(),
      //   },
      //   { transaction: t }
      // );
      Pegawai.process_keluarga = "DONE";
      await Pegawai.save({ transaction: t });
      await t.commit();
      resolve();
    } catch (error) {
      await t.rollback();
      console.error("Job gagal, percobaan ke:", job.attemptsMade + 1);

      if (job.attemptsMade >= 2) {
        await PegawaiMutasi.update(
          { process_keluarga: "FAILED" },
          { where: { id: id } }
        );
        console.log("Job gagal maksimal, status diubah ke failed.");
      }
      reject(error);
    }
  });
};
