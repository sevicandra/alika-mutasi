import dotenv from "dotenv";
import { BiayaMutasiService } from "@/services/hitungBiaya.service";
import sequelize from "@/config/db.config";
import { PegawaiMutasi, RincianBiaya } from "@/repositories";
import { BiayaJob } from "@/types/Job";
import { BaseQueueWorker } from "../base-queue-worker";

dotenv.config();

export const BiayaWorker = new BaseQueueWorker<BiayaJob>("biaya", (job) => {
  return new Promise(async (resolve, reject) => {
    const t = await sequelize.transaction();
    const {
      pegawai_id,
      faktor_darat = 1,
      faktor_laut = 1,
      faktor_udara = 5,
      asal,
      tujuan,
      jumlah_tanggungan_dewasa = 0,
      jumlah_tanggungan_invant = 0,
      tanggungan_art = false,
      golongan,
      kelas_pesawat = "EKONOMI",
      jumlah_hari = 3,
      provinsi_tujuan,
    } = job.data;

    let statusBarang: "TIDAK_BERKELUARGA" | "BERKELUARGA_TANPA_ANAK" | "BERKELUARGA_DENGAN_ANAK";

    try {
      if (asal === tujuan) {
        await PegawaiMutasi.updateById(pegawai_id, { process_biaya: "DONE" }, t);
        await t.commit();
        resolve();
      } else {
        switch (1 + jumlah_tanggungan_dewasa + jumlah_tanggungan_invant) {
          case 1:
            statusBarang = "TIDAK_BERKELUARGA";
            break;
          case 2:
            statusBarang = "BERKELUARGA_TANPA_ANAK";
            break;
          default:
            statusBarang = "BERKELUARGA_DENGAN_ANAK";
            break;
        }
        const volume_barang_keluarga = await BiayaMutasiService.getvolumeBarang({
          golongan: golongan,
          status: statusBarang,
        });
        const volume_barang_art = await BiayaMutasiService.getvolumeBarang({
          golongan: "1",
          status: "TIDAK_BERKELUARGA",
        });
        const uang_harian = await BiayaMutasiService.getUangHarian({
          kode_provinsi: provinsi_tujuan,
        });
        const tarif_packing_darat = await BiayaMutasiService.getTarif({
          jenis: "PACKING_DARAT",
        });
        const tarif_packing_laut = await BiayaMutasiService.getTarif({
          jenis: "PACKING_LAUT",
        });
        const tarif_uang_harian = await BiayaMutasiService.getTarif({
          jenis: "UANG_HARIAN",
        });
        if (
          !volume_barang_keluarga ||
          !volume_barang_art ||
          !uang_harian ||
          !tarif_packing_darat ||
          !tarif_packing_laut
        ) {
          throw new Error("Barang tidak ditemukan");
        }
        const rute_orang = await BiayaMutasiService.RuteOrang({
          asal: asal,
          tujuan: tujuan,
          faktor_darat: faktor_darat,
          faktor_udara: faktor_udara,
          kelas_pesawat: kelas_pesawat,
        });
        if (rute_orang.rute.length === 0) {
          throw new Error("Rute Orang tidak ditemukan");
        }
        const rute_barang = await BiayaMutasiService.RuteBarang({
          asal: asal,
          tujuan: tujuan,
          faktor_laut: faktor_laut,
          faktor_darat: faktor_darat,
        });
        if (rute_barang.rute.length === 0) {
          throw new Error("Rute Barang tidak ditemukan");
        }
        RincianBiaya.delete(
          {
            where: { pegawai_id: pegawai_id },
          },
          t
        );

        const rute: {
          pegawai_id: string;
          volume: number;
          harga_satuan: number;
          jenis:
            | "BIAYA_ANGKUT_ORANG"
            | "BIAYA_ANGKUT_BARANG"
            | "UANG_HARIAN"
            | "BIAYA_ANGKUT_ORANG_ART"
            | "BIAYA_ANGKUT_BARANG_ART"
            | "UANG_HARIAN_ART";
          sub_jenis: string;
          keterangan: string;
          urutan?: number;
        }[] = [];
        for (let index = 1; index < rute_orang.rute.length; index++) {
          const current = rute_orang.rute[index];
          const prev = rute_orang.rute[index - 1];
          rute.push({
            pegawai_id: pegawai_id,
            volume: 1 + jumlah_tanggungan_dewasa + jumlah_tanggungan_invant * 0.1,
            harga_satuan: current.biaya || 0,
            jenis: "BIAYA_ANGKUT_ORANG",
            sub_jenis: current.moda || "BUS",
            keterangan: `${prev.kota} - ${current.kota}`,
            urutan: index,
          });
          if (tanggungan_art) {
            rute.push({
              pegawai_id: pegawai_id,
              volume: 1,
              harga_satuan: current.biaya || 0,
              jenis: "BIAYA_ANGKUT_ORANG_ART",
              sub_jenis: current.moda || "BUS",
              keterangan: `${prev.kota} - ${current.kota}`,
              urutan: index,
            });
          }
        }

        let packingDarat = false;
        let packingLaut = false;
        const pulau_awal = rute_barang.rute[0].pulau;
        const index_kapal = rute_barang.rute.findIndex((r) => r.moda === "KAPAL");
        const jarak_darat_awal =
          index_kapal === -1
            ? rute_barang.rute.reduce((total, r) => total + r.jarak, 0)
            : rute_barang.rute.slice(0, index_kapal).reduce((total, r) => total + r.jarak, 0);
        console.log({ jarak_darat_awal });

        const jarak_darat_jawa = rute_barang.rute
          .filter((r) => r.pulau === "JAWA")
          .reduce((a, b) => a + b.jarak, 0);

        const jarak_darat_luar_jawa = rute_barang.rute
          .filter((r) => r.pulau === "LUAR_JAWA")
          .reduce((a, b) => a + b.jarak, 0);

        for (let index = 1; index < rute_barang.rute.length; index++) {
          const current = rute_barang.rute[index];
          const prev = rute_barang.rute[index - 1];
          const coefisien_jawa = jarak_darat_jawa >= 100 ? 1 : 0.5;
          const coefisien_luar_jawa = jarak_darat_luar_jawa >= 50 ? 1 : 0.5;
          if (current.biaya === 0) {
            continue;
          }
          if (current.moda === "TRUK") {
            if (!packingDarat && !packingLaut) {
              const coefisien_packing_darat =
                pulau_awal === "JAWA"
                  ? jarak_darat_awal >= 100
                    ? 1
                    : 0.5
                  : jarak_darat_awal >= 50
                    ? 1
                    : 0.5;

              rute.push({
                pegawai_id: pegawai_id,
                volume: volume_barang_keluarga,
                harga_satuan: tarif_packing_darat * coefisien_packing_darat,
                jenis: "BIAYA_ANGKUT_BARANG",
                sub_jenis: "PACKING DARAT",
                keterangan: `PACKING DARAT`,
              });

              if (tanggungan_art) {
                rute.push({
                  pegawai_id: pegawai_id,
                  volume: volume_barang_art,
                  harga_satuan: tarif_packing_darat * coefisien_packing_darat,
                  jenis: "BIAYA_ANGKUT_BARANG_ART",
                  sub_jenis: "PACKING DARAT",
                  keterangan: `PACKING DARAT`,
                });
              }
            }
            packingDarat = true;
          } else {
            if (!packingLaut) {
              rute.push({
                pegawai_id: pegawai_id,
                volume: volume_barang_keluarga,
                harga_satuan: tarif_packing_laut,
                jenis: "BIAYA_ANGKUT_BARANG",
                sub_jenis: "PACKING LAUT",
                keterangan: `PACKING LAUT`,
              });

              if (tanggungan_art) {
                rute.push({
                  pegawai_id: pegawai_id,
                  volume: volume_barang_art,
                  harga_satuan: tarif_packing_laut,
                  jenis: "BIAYA_ANGKUT_BARANG_ART",
                  sub_jenis: "PACKING LAUT",
                  keterangan: `PACKING LAUT`,
                });
              }
            }
            packingLaut = true;
          }

          const harga_satuan = current.pulau
            ? current.pulau === "JAWA"
              ? (current.biaya || 0) * coefisien_jawa
              : (current.biaya || 0) * coefisien_luar_jawa
            : current.biaya || 0;

          rute.push({
            pegawai_id: pegawai_id,
            volume: volume_barang_keluarga,
            harga_satuan: (current.moda === "TRUK" ? harga_satuan : current.biaya) || 0,
            jenis: "BIAYA_ANGKUT_BARANG",
            sub_jenis: current.moda || "TRUK",
            keterangan: `${prev.kota} - ${current.kota}`,
            urutan: index,
          });
          if (tanggungan_art) {
            rute.push({
              pegawai_id: pegawai_id,
              volume: volume_barang_art,
              harga_satuan: (current.moda === "TRUK" ? harga_satuan : current.biaya) || 0,
              jenis: "BIAYA_ANGKUT_BARANG_ART",
              sub_jenis: current.moda || "TRUK",
              keterangan: `${prev.kota} - ${current.kota}`,
              urutan: index,
            });
          }
        }
        rute.push({
          pegawai_id: pegawai_id,
          volume: 1 + jumlah_tanggungan_dewasa + jumlah_tanggungan_invant,
          harga_satuan: uang_harian.tarif * (tarif_uang_harian / 100) * jumlah_hari || 0,
          jenis: "UANG_HARIAN",
          sub_jenis: `UANG HARIAN ${jumlah_hari} HARI`,
          keterangan: `UANG HARIAN ${uang_harian.provinsi}`,
        });
        if (tanggungan_art) {
          rute.push({
            pegawai_id: pegawai_id,
            volume: 1,
            harga_satuan: uang_harian.tarif * (tarif_uang_harian / 100) || 0,
            jenis: "UANG_HARIAN_ART",
            sub_jenis: `UANG HARIAN ${jumlah_hari} HARI`,
            keterangan: `UANG HARIAN ${uang_harian.provinsi}`,
          });
        }
        await RincianBiaya.createBulk(rute, { transaction: t });
        await PegawaiMutasi.updateById(pegawai_id, { process_biaya: "DONE" }, t);
        await t.commit();
        resolve();
      }
    } catch (error) {
      console.log(error);

      await t.rollback();
      console.error("Job gagal, percobaan ke:", job.attemptsMade + 1);

      if (job.attemptsMade >= 2) {
        await PegawaiMutasi.updateById(pegawai_id, { process_biaya: "FAILED" });
        console.log("Job gagal maksimal, status diubah ke failed.");
      }
      reject(error);
    }
  });
});
