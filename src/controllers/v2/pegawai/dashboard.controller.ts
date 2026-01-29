import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { BiayaMutasiService } from "@/services/hitungBiaya.service";
import { AuthorizationError, InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { Faq, PegawaiMutasi, RefKantor } from "@/repositories";

export const DashboardController = {
  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const data = await PegawaiMutasi.getStatus(nip);
    successResponse(res, "Success get status", data);
  }),

  getStatusDokumen: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const data = await PegawaiMutasi.getStatusDokumen(nip);
    successResponse(
      res,
      "data berhasil didapatkan",
      data &&
        data
          .sort((a, b) => {
            return a.Ref.urutan - b.Ref.urutan;
          })
          .map((termin, index) => {
            return {
              termin: index + 1,
              nama: termin.Ref.nama,
              req_dokumen: termin.DokumenTermin.filter((dokumen) => dokumen.required).length,
              uploaded_dokumen: termin.DokumenTermin.filter(
                (dokumen) => dokumen.required && dokumen.file
              ).length,
              status: termin.status,
            };
          })
    );
  }),

  getBiaya: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const data = await PegawaiMutasi.getBiaya(nip);

    successResponse(res, "Success get biaya", data);
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const data = await PegawaiMutasi.getHistory(nip);

    successResponse(res, "Success get history", data);
  }),

  getEstimasi: asyncHandler(async (req: Request, res: Response) => {
    let statusBarang: "TIDAK_BERKELUARGA" | "BERKELUARGA_TANPA_ANAK" | "BERKELUARGA_DENGAN_ANAK";
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const { kantor_asal, kantor_tujuan, tanggungan, tanggungan_invant, golongan, pasangan } =
      req.body;

    const kota_asal = await RefKantor.findOne({
      where: {
        kode_satker: kantor_asal,
      },
      include: [
        {
          association: "Kota",
          attributes: ["kode", "kode_provinsi"],
        },
      ],
    });

    const kota_tujuan = await RefKantor.findOne({
      where: {
        kode_satker: kantor_tujuan,
      },
      include: [
        {
          association: "Kota",
          attributes: ["kode", "kode_provinsi"],
        },
      ],
    });

    if (!kota_asal || !kota_tujuan) {
      throw new NotFoundError("Kota asal atau tujuan tidak ditemukan");
    }

    if (kota_asal?.kode_kota === kota_tujuan?.kode_kota) {
      throw new InvalidRequestError("Kantor asal dan tujuan tidak boleh pada kota yang sama");
    }

    switch (
      1 +
      (pasangan.toUpperCase() === "TERTANGGUNG" ? 1 : 0) +
      parseInt(tanggungan) +
      parseInt(tanggungan_invant)
    ) {
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

    const uang_harian = await BiayaMutasiService.getUangHarian({
      kode_provinsi: kota_tujuan.Kota.kode_provinsi,
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
    if (!volume_barang_keluarga || !uang_harian || !tarif_packing_darat || !tarif_packing_laut) {
      throw new Error("Barang tidak ditemukan");
    }
    const rute_orang = await BiayaMutasiService.RuteOrang({
      asal: kota_asal.kode_kota,
      tujuan: kota_tujuan.kode_kota,
      faktor_darat: 1,
      faktor_udara: 5,
      kelas_pesawat: "EKONOMI",
    });
    if (rute_orang.rute.length === 0) {
      throw new Error("Rute Orang tidak ditemukan");
    }
    const rute_barang = await BiayaMutasiService.RuteBarang({
      asal: kota_asal.kode_kota,
      tujuan: kota_tujuan.kode_kota,
      faktor_laut: 5,
      faktor_darat: 1,
    });
    if (rute_barang.rute.length === 0) {
      throw new Error("Rute Barang tidak ditemukan");
    }
    const rute: {
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
        volume:
          1 +
          (pasangan.toUpperCase() === "TERTANGGUNG" ? 1 : 0) +
          parseInt(tanggungan) +
          parseInt(tanggungan_invant) * 0.1,
        harga_satuan: current.biaya || 0,
        jenis: "BIAYA_ANGKUT_ORANG",
        sub_jenis: current.moda || "BUS",
        keterangan: `${prev.kota} - ${current.kota}`,
        urutan: index,
      });
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
            volume: volume_barang_keluarga,
            harga_satuan: tarif_packing_darat,
            jenis: "BIAYA_ANGKUT_BARANG",
            sub_jenis: "PACKING DARAT",
            keterangan: `PACKING DARAT`,
          });
        }
        packingDarat = true;
      } else {
        if (!packingLaut) {
          rute.push({
            volume: volume_barang_keluarga,
            harga_satuan: tarif_packing_laut,
            jenis: "BIAYA_ANGKUT_BARANG",
            sub_jenis: "PACKING LAUT",
            keterangan: `PACKING LAUT`,
          });
        }
        packingLaut = true;
      }
      rute.push({
        volume: volume_barang_keluarga,
        harga_satuan: current.biaya || 0,
        jenis: "BIAYA_ANGKUT_BARANG",
        sub_jenis: current.moda || "TRUK",
        keterangan: `${prev.kota} - ${current.kota}`,
        urutan: index,
      });
    }
    rute.push({
      volume:
        1 +
        (pasangan.toUpperCase() === "TERTANGGUNG" ? 1 : 0) +
        parseInt(tanggungan) +
        parseInt(tanggungan_invant),
      harga_satuan: uang_harian.tarif * (tarif_uang_harian / 100) * 3 || 0,
      jenis: "UANG_HARIAN",
      sub_jenis: `UANG HARIAN 3 HARI`,
      keterangan: `UANG HARIAN ${uang_harian.provinsi}`,
    });

    const biaya = rute.reduce(
      (acc, curr) => {
        const existing = acc.find((item) => item.jenis === curr.jenis);
        if (!existing) {
          acc.push({
            jenis: curr.jenis,
            total: curr.harga_satuan * curr.volume,
          });
        } else {
          existing.total += curr.harga_satuan * curr.volume;
        }
        return acc;
      },
      [] as {
        jenis: string;
        total: number;
      }[]
    );
    successResponse(res, "Estimasi biaya berhasil didapatkan", biaya);
  }),

  getFaqs: asyncHandler(async (req: Request, res: Response) => {
    const nip = req.user?.nip;
    if (!nip) {
      throw new AuthorizationError("Pengguna tidak dapat di verifikasi");
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      status: "PUBLISH",
    };
    if (search) where.question = { [Op.like]: `%${search}%` };
    const { items: data, pagination } = await Faq.findAllWithPagination({
      where,
      limit,
      offset,
    });

    successResponse(res, "Berhasil mengambil data faq", data, pagination);
  }),
};
