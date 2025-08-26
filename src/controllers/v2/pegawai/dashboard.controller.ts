import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { col } from "sequelize";
import { Op } from "sequelize";
import { PegawaiMutasi, Termin, PembayaranLog, RefKantor, Faq } from "@/models";
import { BiayaMutasiService } from "@/services/hitungBiaya.service";

export const getStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const data = await PegawaiMutasi.findOne({
      where: {
        nip,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
      include: [
        {
          association: "KantorAsal",
          attributes: [],
        },
        {
          association: "KantorTujuan",
          attributes: [],
        },
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: [
        "id",
        [col("SuratKeputusan.tanggal"), "tanggal"],
        [col("SuratKeputusan.nomor"), "nomor"],
        [col("KantorAsal.kantor"), "kantor_asal"],
        [col("KantorTujuan.kantor"), "kantor_tujuan"],
        "status",
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const getStatusDokumen = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const mutasi = await PegawaiMutasi.findOne({
      where: {
        nip,
        status: {
          [Op.not]: ["DRAFT", "PENDING_APROVAL"],
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: [
        "id",
        [col("SuratKeputusan.tanggal"), "tanggal"],
        [col("SuratKeputusan.nomor"), "nomor"],
        "status",
      ],
    });
    if (!mutasi) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }

    const data = await Termin.findAll({
      where: {
        pegawai_id: mutasi.id,
      },
      include: [
        {
          association: "DokumenTermin",
        },
        {
          association: "Ref",
        },
      ],
    });
    if (!data || data.length === 0) {
      return errorResponse(res, "data dokumen tidak ditemukan", null, 404);
    }

    return successResponse(
      res,
      "data berhasil didapatkan",
      data
        .sort((a, b) => {
          return a.Ref.urutan - b.Ref.urutan;
        })
        .map((termin, index) => {
          return {
            termin: index + 1,
            nama: termin.Ref.nama,
            req_dokumen: termin.DokumenTermin.filter(
              (dokumen) => dokumen.required
            ).length,
            uploaded_dokumen: termin.DokumenTermin.filter(
              (dokumen) => dokumen.required && dokumen.file
            ).length,
            status: termin.status,
          };
        })
    );
  } catch (error: unknown) {
    console.log(error);
    next(error);
  }
};

export const getBiaya = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const data = await PegawaiMutasi.findOne({
      where: {
        nip,
        status: {
          [Op.not]: ["DRAFT", "PENDING_APROVAL"],
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
        {
          association: "MonitoringTagihan",
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: [
        "id",
        [col("SuratKeputusan.tanggal"), "tanggal"],
        [col("SuratKeputusan.nomor"), "nomor"],
        "status",
        [col("MonitoringTagihan.total_tagihan"), "biaya"],
      ],
    });
    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const getHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const mutasi = await PegawaiMutasi.findOne({
      where: {
        nip,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
      include: [
        {
          association: "SuratKeputusan",
          where: {
            status: "PUBLISH",
          },
          attributes: [],
        },
      ],
      order: [["SuratKeputusan", "tanggal", "DESC"]],
      attributes: [
        "id",
        [col("SuratKeputusan.tanggal"), "tanggal"],
        [col("SuratKeputusan.nomor"), "nomor"],
        "status",
      ],
    });
    if (!mutasi) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    const data = await PembayaranLog.findAll({
      where: {
        pegawai_id: mutasi.id,
      },
      attributes: {
        exclude: ["payload", "pegawai_id"],
      },
      order: [["created_at", "DESC"]],
    });
    if (!data || data.length === 0) {
      return errorResponse(res, "data history tidak ditemukan", null, 404);
    }
    return successResponse(res, "data berhasil didapatkan", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const getEstimasi = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let statusBarang:
    | "TIDAK_BERKELUARGA"
    | "BERKELUARGA_TANPA_ANAK"
    | "BERKELUARGA_DENGAN_ANAK";

  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const ValidationError: { field: string; message: string }[] = [];
    const {
      kantor_asal,
      kantor_tujuan,
      tanggungan,
      tanggungan_invant,
      golongan,
      pasangan,
    } = req.body;

    if (!kantor_asal)
      ValidationError.push({
        field: "kantor_asal",
        message: "Kantor asal tidak boleh kosong",
      });
    if (!kantor_tujuan)
      ValidationError.push({
        field: "kantor_tujuan",
        message: "Kantor tujuan tidak boleh kosong",
      });
    if (!tanggungan)
      ValidationError.push({
        field: "tanggungan",
        message: "Tanggungan tidak boleh kosong",
      });
    if (!tanggungan_invant)
      ValidationError.push({
        field: "tanggungan_invant",
        message: "Tanggungan invant tidak boleh kosong",
      });
    if (!golongan)
      ValidationError.push({
        field: "golongan",
        message: "Golongan tidak boleh kosong",
      });
    if (ValidationError.length > 0) {
      return errorResponse(res, "Validation gagal", ValidationError, 422);
    }

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
      return errorResponse(
        res,
        "Kota asal atau tujuan tidak ditemukan",
        null,
        404
      );
    }

    if (kota_asal?.kode_kota === kota_tujuan?.kode_kota) {
      return errorResponse(
        res,
        "Kantor asal dan tujuan tidak boleh pada kota yang sama",
        null,
        400
      );
    }

    switch (
      1 +
      (pasangan ? 1 : 0) +
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
    if (
      !volume_barang_keluarga ||
      !uang_harian ||
      !tarif_packing_darat ||
      !tarif_packing_laut
    ) {
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
      faktor_laut: 1,
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
          (pasangan ? 1 : 0) +
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
        (pasangan ? 1 : 0) +
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
    return successResponse(res, "Estimasi biaya berhasil didapatkan", biaya);
  } catch (error: unknown) {
    next(error);
  }
};

export const getFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nip } = req.user;
    if (!nip) {
      return errorResponse(
        res,
        "Pengguna tidak dapat di verifikasi",
        null,
        403
      );
    }
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      status: "PUBLISH",
    };
    if (search) where.question = { [Op.like]: `%${search}%` };
    const { rows: data, count } = await Faq.findAndCountAll({
      where,
      limit,
      offset,
    });
    return successResponse(res, "Berhasil mengambil data faq", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};
