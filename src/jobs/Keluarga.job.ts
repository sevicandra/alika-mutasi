import { Job } from "bull";
import dotenv from "dotenv";
import { KemenkeuService } from "@/services/kemenkeu.service";
import sequelize from "@/config/db.config";
import { Adult, Invant } from "@/helpers/age.helper";
import { Keluarga, PegawaiMutasi, RefHubunganKeluarga } from "@/repositories";
import { PegawaiJob } from "@/types/Job";

dotenv.config();

export const processKeluarga = async (job: Job<PegawaiJob>): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const t = await sequelize.transaction();
    const { id } = job.data;
    try {
      const Pegawai = await PegawaiMutasi.findById(id, {
        include: [{ association: "SuratKeputusan" }],
      });
      if (!Pegawai) {
        throw new Error("Pegawai not found");
      }
      const keluarga = await KemenkeuService.getKeluarga({ nip: Pegawai.nip });
      const pasangan = await RefHubunganKeluarga.findAll({
        where: { jenis: "PASANGAN" },
        attributes: ["kode", "jenis"],
      });
      const anak = await RefHubunganKeluarga.findAll({
        where: { jenis: "ANAK" },
        attributes: ["kode", "jenis"],
      });

      console.log(
        keluarga.filter((item) => {
          item.IdrefHubungan.toString() === "2";
        })
      );

      const dataPasangan = keluarga
        .filter((item) =>
          pasangan.some(
            (hub) =>
              hub.kode.toString() === item.IdrefHubungan.toString() &&
              item.IdrefStatusHidupKeluarga !== "0"
          )
        )
        .map((item) => {
          return {
            pegawai_id: id,
            hris_id: item.IdpegawaiKeluarga,
            nama: item.Nama,
            hubungan: item.IdrefHubungan.toString(),
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
        .filter((item) =>
          anak.some(
            (a) =>
              a.kode.toString() === item.IdrefHubungan.toString() &&
              item.IdrefStatusHidupKeluarga !== "0"
          )
        )
        .map((item) => {
          const tanggungan = keluarga.filter((kel) => kel.StatusTanggungan === "Tertanggung");
          const invant = Invant(new Date(item.TanggalLahir), Pegawai.SuratKeputusan.tanggal);
          const adult = Adult(new Date(item.TanggalLahir), Pegawai.SuratKeputusan.tanggal);
          return {
            pegawai_id: id,
            hris_id: item.IdpegawaiKeluarga,
            nama: item.Nama,
            hubungan: item.IdrefHubungan.toString(),
            tanggal_lahir: new Date(item.TanggalLahir),
            pekerjaan: item.Pekerjaan,
            is_invant: invant,
            status: tanggungan.length > 0 && !adult ? "TERTANGGUNG" : "TIDAK_TERTANGGUNG",
          };
        });

      const data = [...dataPasangan, ...dataAnak];

      await Keluarga.createBulk(data, { transaction: t });
      Pegawai.process_keluarga = "DONE";
      await Pegawai.save({ transaction: t });
      await t.commit();
      resolve();
    } catch (error) {
      await t.rollback();
      console.error("Job gagal, percobaan ke:", job.attemptsMade + 1);

      if (job.attemptsMade >= 2) {
        await PegawaiMutasi.update({ process_keluarga: "FAILED" }, { where: { id: id } });
        console.log("Job gagal maksimal, status diubah ke failed.");
      }
      reject(error);
    }
  });
};
