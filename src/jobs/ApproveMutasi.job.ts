import { Job } from "bull";
import { BiayaJob } from "@/types/Job";
import sequelize from "@/config/db.config";
import { PegawaiMutasi, MonitoringTagihan, Termin } from "@/models";
import { BiayaMutasiService } from "@/services/hitungBiaya.service";
import { RincianBiaya } from "@/models";
import dotenv from "dotenv";
dotenv.config();

export const processApproveMutasi = async (
  job: Job<BiayaJob>
): Promise<void> => {
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

    let statusBarang:
      | "TIDAK_BERKELUARGA"
      | "BERKELUARGA_TANPA_ANAK"
      | "BERKELUARGA_DENGAN_ANAK";

    try {
      RincianBiaya.destroy({
        where: { pegawai_id: pegawai_id },
        transaction: t,
      });
      if (asal === tujuan) {
        await PegawaiMutasi.update(
          { process_biaya: "DONE" },
          { where: { id: pegawai_id }, transaction: t }
        );
        await t.commit();
        resolve();
        return;
      }
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
      const rute: {
        pegawai_id: string;
        volume: number;
        harga_satuan: number;
        jenis: string;
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
      for (let index = 1; index < rute_barang.rute.length; index++) {
        const current = rute_barang.rute[index];
        const prev = rute_barang.rute[index - 1];
        if (current.biaya === 0) {
          continue;
        }
        if (current.moda === "TRUK") {
          if (!packingDarat && !packingLaut) {
            rute.push({
              pegawai_id: pegawai_id,
              volume: volume_barang_keluarga,
              harga_satuan: tarif_packing_darat,
              jenis: "BIAYA_ANGKUT_BARANG",
              sub_jenis: "PACKING DARAT",
              keterangan: `PACKING DARAT`,
            });

            if (tanggungan_art) {
              rute.push({
                pegawai_id: pegawai_id,
                volume: volume_barang_art,
                harga_satuan: tarif_packing_darat,
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
        rute.push({
          pegawai_id: pegawai_id,
          volume: volume_barang_keluarga,
          harga_satuan: current.biaya || 0,
          jenis: "BIAYA_ANGKUT_BARANG",
          sub_jenis: current.moda || "TRUK",
          keterangan: `${prev.kota} - ${current.kota}`,
          urutan: index,
        });
        if (tanggungan_art) {
          rute.push({
            pegawai_id: pegawai_id,
            volume: volume_barang_art,
            harga_satuan: current.biaya || 0,
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
        harga_satuan: uang_harian.tarif * tarif_uang_harian * jumlah_hari || 0,
        jenis: "UANG_HARIAN",
        sub_jenis: `UANG HARIAN ${jumlah_hari} HARI`,
        keterangan: `UANG HARIAN ${uang_harian.provinsi}`,
      });
      if (tanggungan_art) {
        rute.push({
          pegawai_id: pegawai_id,
          volume: 1,
          harga_satuan: uang_harian.tarif * tarif_uang_harian || 0,
          jenis: "UANG_HARIAN_ART",
          sub_jenis: `UANG HARIAN ${jumlah_hari} HARI`,
          keterangan: `UANG HARIAN ${uang_harian.provinsi}`,
        });
      }
      await RincianBiaya.bulkCreate(rute, { transaction: t });
      const tagihan = await MonitoringTagihan.findOne({
        where: { pegawai_id: pegawai_id },
        transaction: t,
      });

      if (tagihan?.sisa_tagihan && tagihan.sisa_tagihan !== 0) {
        const termin = await Termin.findOne({
          where: { pegawai_id: pegawai_id },
          include: [
            {
              association: "Ref",
            },
          ],
          order: [["Ref", "urutan", "DESC"]],
          transaction: t,
        });
        if (termin) {
          termin.nominal = tagihan.sisa_tagihan + termin?.nominal || 0;
          await termin.save({ transaction: t });
        }
      }

      await PegawaiMutasi.update(
        { status: "APPROVED" },
        { where: { id: pegawai_id }, transaction: t }
      );
      await t.commit();
      resolve();
    } catch (error) {
      await t.rollback();
      console.error("Job gagal, percobaan ke:", job.attemptsMade + 1);

      if (job.attemptsMade >= 2) {
        await PegawaiMutasi.update(
          { status: "PENDING_APROVAL" },
          { where: { id: pegawai_id } }
        );
        console.log("Job gagal maksimal, status diubah ke failed.");
      }
      reject(error);
    }
  });
};
