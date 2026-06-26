import dotenv from "dotenv";
import { Op } from "sequelize";
import { AlikaService } from "@/services/alika.service";
import { GenerateFileService } from "@/services/generateFile.service";
import { BiayaMutasiService } from "@/services/hitungBiaya.service";
import { Logger } from "@/services/log.service";
import { minioService } from "@/services/minio-service";
import sequelize from "@/config/db.config";
import {
  DokumenTermin,
  MonitoringTagihan,
  PegawaiMutasi,
  RincianBiaya,
  Termin,
  TteDokumen,
} from "@/repositories";
import { BiayaJob } from "@/types/Job";
import { BaseQueueWorker } from "../base-queue-worker";

dotenv.config();

export const ApproveMutasiWorker = new BaseQueueWorker<BiayaJob>("approve-mutasi", (job) => {
  return new Promise(async (resolve, reject) => {
    const uploadedFiles: string[] = [];
    const t = await sequelize.transaction();
    const {
      nip,
      agenda,
      pegawai_id,
      asal,
      tujuan,
      jumlah_tanggungan_dewasa = 0,
      jumlah_tanggungan_invant = 0,
      tanggungan_art = false,
      golongan,
    } = job.data;

    let statusBarang: "TIDAK_BERKELUARGA" | "BERKELUARGA_TANPA_ANAK" | "BERKELUARGA_DENGAN_ANAK";

    try {
      RincianBiaya.delete(
        {
          where: {
            pegawai_id: pegawai_id,
            jenis: {
              [Op.or]: ["BIAYA_ANGKUT_ORANG_ART", "BIAYA_ANGKUT_BARANG_ART", "UANG_HARIAN_ART"],
            },
          },
        },
        t
      );
      if (asal === tujuan) {
        await PegawaiMutasi.updateOne({ where: { id: pegawai_id } }, { status: "APPROVED" }, t);
        await t.commit();
        resolve();
        return;
      }
      const ruteOrang = await RincianBiaya.findAll({
        where: { pegawai_id: pegawai_id, jenis: "BIAYA_ANGKUT_ORANG" },
      });
      const ruteBarang = await RincianBiaya.findAll({
        where: { pegawai_id: pegawai_id, jenis: "BIAYA_ANGKUT_BARANG" },
      });
      const uangHarian = await RincianBiaya.findAll({
        where: { pegawai_id: pegawai_id, jenis: "UANG_HARIAN" },
      });
      if (ruteOrang.length === 0 || ruteBarang.length === 0 || uangHarian.length === 0 || !agenda) {
        throw new Error("Rute tidak ditemukan");
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
      if (!volume_barang_keluarga || !volume_barang_art) {
        throw new Error("Barang tidak ditemukan");
      }

      for (const r of ruteOrang) {
        r.volume = 1 + jumlah_tanggungan_dewasa + jumlah_tanggungan_invant * 0.1;
        await r.save({ transaction: t });
      }
      for (const r of ruteBarang) {
        r.volume = volume_barang_keluarga;
        await r.save({ transaction: t });
      }
      for (const r of uangHarian) {
        r.volume = 1 + jumlah_tanggungan_dewasa + jumlah_tanggungan_invant;
        await r.save({ transaction: t });
      }
      const rute_art: {
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

      if (tanggungan_art) {
        for (const r of ruteOrang) {
          rute_art.push({
            pegawai_id: pegawai_id,
            volume: 1,
            harga_satuan: r.harga_satuan,
            jenis: "BIAYA_ANGKUT_ORANG_ART",
            sub_jenis: r.sub_jenis,
            keterangan: r.keterangan,
            urutan: r.urutan,
          });
        }
        for (const r of ruteBarang) {
          rute_art.push({
            pegawai_id: pegawai_id,
            volume: volume_barang_art,
            harga_satuan: r.harga_satuan,
            jenis: "BIAYA_ANGKUT_BARANG_ART",
            sub_jenis: r.sub_jenis,
            keterangan: r.keterangan,
            urutan: r.urutan,
          });
        }
        for (const r of uangHarian) {
          rute_art.push({
            pegawai_id: pegawai_id,
            volume: 1,
            harga_satuan: r.harga_satuan,
            jenis: "UANG_HARIAN_ART",
            sub_jenis: r.sub_jenis,
            keterangan: r.keterangan,
            urutan: r.urutan,
          });
        }
      }
      await RincianBiaya.createBulk(rute_art, { transaction: t });
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

      await PegawaiMutasi.updateOne({ where: { id: pegawai_id } }, { status: "APPROVED" }, t);
      const pegawai = await PegawaiMutasi.findOne({
        where: { id: pegawai_id },
        include: [
          {
            association: "Termin",
            order: [["urutan", "DESC"]],
            include: [
              {
                association: "Ref",
              },
            ],
          },
          {
            association: "RincianBiaya",
          },
          {
            association: "KantorAsal",
            include: [{ association: "Kota" }],
          },
          {
            association: "KantorTujuan",
            include: [{ association: "Kota" }],
          },
          {
            association: "SuratKeputusan",
          },
          {
            association: "Golongan",
          },
          {
            association: "Keluarga",
            include: [
              {
                association: "Ref",
              },
            ],
          },
        ],
        transaction: t,
      });
      if (!pegawai) {
        throw new Error("Pegawai not found");
      }
      const files = await GenerateFileService.generateFile(pegawai, agenda);
      for (const file of files) {
        if (file.file) uploadedFiles.push(file.file);
      }
      for (const file of files) {
        const dokumen = await DokumenTermin.create(
          {
            termin_id: file.termin_id,
            document_type: file.jenis,
            file: file.file,
            required: file.required,
            uploadable: file.uploadable,
          },
          { transaction: t }
        );
        for (const tte of file.penandatangan) {
          await TteDokumen.create(
            {
              nama: tte.nama,
              dokumen_id: dokumen.id,
              nip: tte.nip,
              jabatan: tte.jabatan,
              koordinat_qr: {
                page: tte.koordinat.page,
                x: tte.koordinat.x,
                y: tte.koordinat.y,
              },
            },
            { transaction: t }
          );
        }
      }
      await AlikaService.sendPushNotification({
        nip: nip,
        message: `mutasi berhasil dihitung, silahkan lanjutkan ke proses pembayaran`,
      });
      await Logger.GeneralAction({
        pegawai_id: pegawai_id,
        actor_nip: null,
        actor_role: "System",
        action: "Hitung Biaya Mutasi",
        description: "mutasi berhasil dihitung dan dokumen pendukung berhasil dibuat",
        transaction: t,
      });
      await t.commit();
      resolve();
    } catch (error) {
      for (const filePath of uploadedFiles) {
        try {
          await minioService.deleteFile(filePath);
        } catch (deleteError) {
          console.warn(`Gagal menghapus file rollback: ${filePath}`, deleteError);
        }
      }
      await t.rollback();
      console.error("Job gagal, percobaan ke:", job.attemptsMade + 1);

      if (job.attemptsMade >= 2) {
        await PegawaiMutasi.update({ status: "PENDING_APROVAL" }, { where: { id: pegawai_id } });
        await AlikaService.sendPushNotification({
          nip: nip,
          message: `gagal melakukan perhitungan biaya mutasi, mohon hubungi admin`,
        });
        await Logger.GeneralAction({
          pegawai_id: pegawai_id,
          actor_nip: null,
          actor_role: "System",
          action: "Hitung Biaya Mutasi",
          description: `mutasi gagal dihitung dan dokumen pendukung gagal dibuat, error: ${error}`,
        });
        console.log("Job gagal maksimal, status diubah ke failed.");
      }
      reject(error);
    }
  });
});
