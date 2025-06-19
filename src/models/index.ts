import Art from "./Art.model";
import Keluarga from "./Keluarga.model";
import PegawaiMutasi from "./PegawaiMutasi.model";
import RefBarang from "./RefBarang.model";
import RefDarat from "./RefDarat.model";
import RefGolongan from "./RefGolongan.model";
import RefKantor from "./RefKantor.model";
import RefKapal from "./RefKapal.model";
import RefHubunganKeluarga from "./RefHubunganKeluarga.model";
import RefKota from "./RefKota.model";
import RefPesawat from "./RefPesawat.model";
import RefProvinsi from "./RefProvinsi.model";
import RefTarif from "./RefTarif.model";
import RefUangHarian from "./RefUangHarian.model";
import RincianBiaya from "./RincianBiaya.model";
import SuratKeputusan from "./SuratKeputusan.model";
import PerubahanKeluarga from "./PerubahanKeluarga.model";
import Termin from "./Termin.model";
import MonitoringTagihan from "./MonitoringTagihan.model";
import RefTermin from "./RefTermin.model";
import RefTimeline from "./RefTimeline.model";
import Timeline from "./Timeline.model";
import Sanggah from "./Sanggah.model";
import DataSanggah from "./DataSanggah.model";
import sequelize from "@/config/db.config";
import TicketCounter from "./TicketCounter.model";
import DokumenTermin from "./DokumenTermin.model";
import { Op } from "sequelize";

Art.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  targetKey: "id",
  as: "Pegawai",
});

Keluarga.belongsTo(RefHubunganKeluarga, {
  foreignKey: "hubungan",
  targetKey: "kode",
  as: "Ref",
});
Keluarga.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  targetKey: "id",
  as: "Pegawai",
});

PegawaiMutasi.belongsTo(RefKantor, {
  foreignKey: "kantor_asal",
  targetKey: "kode_satker",
  as: "KantorAsal",
});
PegawaiMutasi.belongsTo(RefKantor, {
  foreignKey: "kantor_tujuan",
  targetKey: "kode_satker",
  as: "KantorTujuan",
});
PegawaiMutasi.hasMany(Keluarga, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "Keluarga",
});
PegawaiMutasi.hasMany(Keluarga, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "KeluargaDewasa",
  scope: {
    is_invant: false,
    hubungan: {
      [Op.ne]: "99",
    },
  },
});
PegawaiMutasi.hasMany(Keluarga, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "KeluargaInvant",
  scope: {
    is_invant: true,
    hubungan: {
      [Op.ne]: "99",
    },
  },
});
PegawaiMutasi.hasMany(Keluarga, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "TanggunganDewasa",
  scope: {
    is_invant: false,
    status: "TERTANGGUNG",
    hubungan: {
      [Op.ne]: "99",
    },
  },
});
PegawaiMutasi.hasMany(Keluarga, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "TanggunganInvant",
  scope: {
    is_invant: true,
    status: "TERTANGGUNG",
    hubungan: {
      [Op.ne]: "99",
    },
  },
});
PegawaiMutasi.hasOne(Keluarga, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "Art",
  scope: {
    hubungan: "99",
  },
});
PegawaiMutasi.belongsTo(SuratKeputusan, {
  foreignKey: "sk_id",
  targetKey: "id",
  as: "SuratKeputusan",
});
PegawaiMutasi.hasMany(RincianBiaya, {
  foreignKey: "pegawai_id",
  as: "RincianBiaya",
});
PegawaiMutasi.belongsTo(RefGolongan, {
  foreignKey: "golongan",
  targetKey: "kode",
  as: "Golongan",
});
PegawaiMutasi.hasMany(PerubahanKeluarga, {
  foreignKey: "pegawai_id",
  as: "PerubahanKeluarga",
});
PegawaiMutasi.hasMany(Termin, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "Termin",
});
PegawaiMutasi.hasOne(MonitoringTagihan, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "MonitoringTagihan",
});

PerubahanKeluarga.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  as: "Pegawai",
});

RefDarat.belongsTo(RefKota, {
  foreignKey: "kota_asal",
  targetKey: "kode",
  as: "KotaAsal",
});
RefDarat.belongsTo(RefKota, {
  foreignKey: "kota_tujuan",
  targetKey: "kode",
  as: "KotaTujuan",
});

RefKota.hasMany(RefKantor, {
  foreignKey: "kode_kota",
  sourceKey: "kode",
  as: "Kantor",
});
RefKota.belongsTo(RefProvinsi, {
  foreignKey: "kode_provinsi",
  targetKey: "kode",
  as: "Provinsi",
});

RefKantor.belongsTo(RefKota, {
  foreignKey: "kode_kota",
  targetKey: "kode",
  as: "Kota",
});

RefKapal.belongsTo(RefKota, {
  foreignKey: "kota_asal",
  targetKey: "kode",
  as: "KotaAsal",
});
RefKapal.belongsTo(RefKota, {
  foreignKey: "kota_tujuan",
  targetKey: "kode",
  as: "KotaTujuan",
});

RefProvinsi.hasMany(RefKota, {
  foreignKey: "kode_provinsi",
  sourceKey: "kode",
  as: "Kota",
});

RefPesawat.belongsTo(RefKota, {
  foreignKey: "kota_asal",
  targetKey: "kode",
  as: "KotaAsal",
});
RefPesawat.belongsTo(RefKota, {
  foreignKey: "kota_tujuan",
  targetKey: "kode",
  as: "KotaTujuan",
});
RefProvinsi.hasOne(RefUangHarian, {
  foreignKey: "kode_provinsi",
  sourceKey: "kode",
  as: "UangHarian",
});

RefUangHarian.belongsTo(RefProvinsi, {
  foreignKey: "kode_provinsi",
  targetKey: "kode",
  as: "Provinsi",
});

RincianBiaya.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  as: "Pegawai",
});

SuratKeputusan.hasMany(PegawaiMutasi, {
  foreignKey: "sk_id",
  sourceKey: "id",
  as: "Pegawai",
});

SuratKeputusan.hasMany(Timeline, {
  foreignKey: "sk_id",
  sourceKey: "id",
  as: "Timeline",
});

Termin.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  targetKey: "id",
  as: "Pegawai",
});

Termin.belongsTo(RefTermin, {
  foreignKey: "ref_termin",
  targetKey: "kode",
  as: "Ref",
});

MonitoringTagihan.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  targetKey: "id",
  as: "Pegawai",
});

Timeline.belongsTo(SuratKeputusan, {
  foreignKey: "sk_id",
  targetKey: "id",
  as: "SuratKeputusan",
});
Timeline.belongsTo(RefTimeline, {
  foreignKey: "ref_kode",
  targetKey: "kode",
  as: "Ref",
});

Sanggah.belongsTo(PegawaiMutasi, {
  foreignKey: "pegawai_id",
  targetKey: "id",
  as: "Pegawai",
});

PegawaiMutasi.hasOne(Sanggah, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "CurrentSanggah",
  scope: {
    status: "PENDING",
  },
});

PegawaiMutasi.hasOne(Sanggah, {
  foreignKey: "pegawai_id",
  sourceKey: "id",
  as: "Sanggah",
});

DataSanggah.belongsTo(Sanggah, {
  foreignKey: "sanggah_id",
  as: "Sanggah",
});

DataSanggah.belongsTo(Keluarga, {
  foreignKey: "keluarga_id",
  as: "Ref",
});
Keluarga.hasMany(DataSanggah, {
  foreignKey: "keluarga_id",
  as: "DataSanggah",
});
Sanggah.hasMany(DataSanggah, {
  foreignKey: "sanggah_id",
  as: "DataSanggah",
});
Termin.hasMany(DokumenTermin, {
  foreignKey: "termin_id",
  as: "DokumenTermin",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

DokumenTermin.belongsTo(Termin, {
  foreignKey: "termin_id",
  as: "Termin",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

DokumenTermin.belongsTo(RefTermin, {
  foreignKey: "ref_termin",
  as: "RefTermin",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

export {
  sequelize,
  Art,
  Keluarga,
  PegawaiMutasi,
  RefBarang,
  RefDarat,
  RefGolongan,
  RefKantor,
  RefKapal,
  RefHubunganKeluarga,
  RefKota,
  RefPesawat,
  RefProvinsi,
  RefTarif,
  RefUangHarian,
  RincianBiaya,
  SuratKeputusan,
  PerubahanKeluarga,
  Termin,
  MonitoringTagihan,
  RefTermin,
  RefTimeline,
  Timeline,
  Sanggah,
  DataSanggah,
  TicketCounter,
  DokumenTermin,
};
