import sequelize from "@/config/db.config";
import {
  Model,
  Optional,
  DataTypes,
  BelongsTo,
  HasMany,
  HasOne,
} from "sequelize";
import RefKantor from "./RefKantor.model";
import Keluarga from "./Keluarga.model";
import SuratKeputusan from "./SuratKeputusan.model";
import Art from "./Art.model";
import RincianBiaya from "./RincianBiaya.model";
import RefGolongan from "./RefGolongan.model";
import MonitoringTagihan from "./MonitoringTagihan.model";
import Sanggah from "./Sanggah.model";
import Termin from "./Termin.model";

type PegawaiMutasiAttributes = {
  id: string;
  sk_id: string;
  kantor_asal: string;
  kantor_tujuan: string;
  nip: string;
  nama: string;
  golongan: string;
  status:
    | "DRAFT"
    | "PENDING_APROVAL"
    | "APPROVED"
    | "CALCULATING"
    | "DISPUTED"
    | "REVISED";
  jumlah_hari: number;
  process_keluarga: "IDLE" | "PROCESSING" | "DONE" | "FAILED" | "RETRYING";
  process_biaya: "IDLE" | "PROCESSING" | "DONE" | "FAILED" | "RETRYING";
  process_termin: "IDLE" | "PROCESSING" | "DONE" | "FAILED" | "RETRYING";
  faktor_darat: number;
  faktor_laut: number;
  faktor_udara: number;
  kelas_pesawat: "EKONOMI" | "BISNIS";
  nomor_spd: string | null;
  tanggal_spd: Date | null;
};

type PegawaiMutasiCreationAttributes = Optional<
  PegawaiMutasiAttributes,
  | "id"
  | "status"
  | "jumlah_hari"
  | "process_keluarga"
  | "process_biaya"
  | "process_termin"
  | "faktor_darat"
  | "faktor_laut"
  | "faktor_udara"
  | "kelas_pesawat"
  | "nomor_spd"
  | "tanggal_spd"
>;

class PegawaiMutasi
  extends Model<PegawaiMutasiAttributes, PegawaiMutasiCreationAttributes>
  implements PegawaiMutasiAttributes
{
  public id!: string;
  public sk_id!: string;
  public kantor_asal!: string;
  public kantor_tujuan!: string;
  public nip!: string;
  public nama!: string;
  public golongan!: string;
  public status!:
    | "DRAFT"
    | "PENDING_APROVAL"
    | "APPROVED"
    | "CALCULATING"
    | "DISPUTED"
    | "REVISED";
  public jumlah_hari!: number;
  public process_keluarga!:
    | "IDLE"
    | "PROCESSING"
    | "DONE"
    | "FAILED"
    | "RETRYING";
  public process_biaya!: "IDLE" | "PROCESSING" | "DONE" | "FAILED" | "RETRYING";
  public process_termin!:
    | "IDLE"
    | "PROCESSING"
    | "DONE"
    | "FAILED"
    | "RETRYING";
  public faktor_darat!: number;
  public faktor_laut!: number;
  public faktor_udara!: number;
  public kelas_pesawat!: "EKONOMI" | "BISNIS";
  public nomor_spd!: string | null;
  public tanggal_spd!: Date | null;

  public KantorAsal!: RefKantor;
  public KantorTujuan!: RefKantor;
  public Keluarga!: Keluarga[] | [];
  public KeluargaDewasa!: Keluarga[] | [];
  public KeluargaInvant!: Keluarga[] | [];
  public TanggunganDewasa!: Keluarga[] | [];
  public TanggunganInvant!: Keluarga[] | [];
  public SuratKeputusan!: SuratKeputusan;
  public Art!: Keluarga | null;
  public RincianBiaya!: RincianBiaya[] | [];
  public Golongan!: RefGolongan;
  public MonitoringTagihan!: MonitoringTagihan;
  public CurrentSanggah!: Sanggah | null;
  public Sanggah!: Sanggah[] | [];
  public Termin!: Termin[] | [];

  public static associations: {
    KantorAsal: BelongsTo<PegawaiMutasi, RefKantor>;
    KantorTujuan: BelongsTo<PegawaiMutasi, RefKantor>;
    Keluarga: HasMany<PegawaiMutasi, Keluarga>;
    TanggunganDewasa: HasMany<PegawaiMutasi, Keluarga>;
    TanggunganInvant: HasMany<PegawaiMutasi, Keluarga>;
    KeluargaDewasa: HasMany<PegawaiMutasi, Keluarga>;
    KeluargaInvant: HasMany<PegawaiMutasi, Keluarga>;
    SuratKeputusan: BelongsTo<PegawaiMutasi, SuratKeputusan>;
    Art: HasOne<PegawaiMutasi, Art>;
    RincianBiaya: HasMany<PegawaiMutasi, RincianBiaya>;
    Golongan: BelongsTo<PegawaiMutasi, RefGolongan>;
    MonitoringTagihan: HasOne<PegawaiMutasi, MonitoringTagihan>;
    CurrentSanggah: HasOne<PegawaiMutasi, Sanggah>;
    Sanggah: HasMany<PegawaiMutasi, Sanggah>;
    Termin: HasMany<PegawaiMutasi, Termin>;
  };

  async addKeluarga({
    nik,
    nama,
    hubungan,
    tanggal_lahir,
    invant,
    pekerjaan,
    status = "TIDAK_TERTANGGUNG",
  }: {
    nik?: string;
    nama: string;
    hubungan: string;
    tanggal_lahir: Date;
    invant: boolean;
    pekerjaan: string;
    status: string;
  }) {
    return await Keluarga.create({
      pegawai_id: this.id,
      nik: nik,
      nama: nama,
      hubungan: hubungan,
      tanggal_lahir: tanggal_lahir,
      is_invant: invant,
      pekerjaan: pekerjaan,
      status: status,
    });
  }

  async addArt({ nik, nama }: { nik: string; nama: string }) {
    return await Art.create({
      pegawai_id: this.id,
      nik: nik,
      nama: nama,
    });
  }
}

PegawaiMutasi.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sk_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "nip_sk",
        msg: "NIP Pegawai sudah ada di SK ini",
      },
      references: {
        model: SuratKeputusan,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    golongan: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          msg: "Golongan harus 1-3 dan A-D atau 4 dan A-E",
          args: /^[1-3]{1}[A-D]{1}|[4]{1}[A-E]{1}$/,
        },
      },
      references: {
        model: "RefGolongan",
        key: "kode",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    kantor_asal: {
      type: DataTypes.STRING(6),
      allowNull: false,
      references: {
        model: RefKantor,
        key: "kode_satker",
      },
      validate: {
        is: /^[0-9]{6}$/,
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    kantor_tujuan: {
      type: DataTypes.STRING(6),
      allowNull: false,
      references: {
        model: RefKantor,
        key: "kode_satker",
      },
      validate: {
        is: /^[0-9]{6}$/,
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    nip: {
      type: DataTypes.STRING(18),
      allowNull: false,
      validate: {
        is: /^[0-9]{18}$/,
      },
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jumlah_hari: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PENDING_APROVAL",
        "APPROVED",
        "CALCULATING",
        "DISPUTED",
        "REVISED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    process_keluarga: {
      type: DataTypes.ENUM("IDLE", "PROCESSING", "DONE", "FAILED", "RETRYING"),
      allowNull: false,
      defaultValue: "IDLE",
    },
    process_biaya: {
      type: DataTypes.ENUM("IDLE", "PROCESSING", "DONE", "FAILED", "RETRYING"),
      allowNull: false,
      defaultValue: "IDLE",
    },
    process_termin: {
      type: DataTypes.ENUM("IDLE", "PROCESSING", "DONE", "FAILED", "RETRYING"),
      allowNull: false,
      defaultValue: "IDLE",
    },
    faktor_darat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    faktor_laut: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    faktor_udara: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    kelas_pesawat: {
      type: DataTypes.ENUM("EKONOMI", "BISNIS"),
      allowNull: false,
      defaultValue: "EKONOMI",
    },
    nomor_spd: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tanggal_spd: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pegawai_mutasi",
    modelName: "PegawaiMutasi",
    indexes: [
      {
        type: "UNIQUE",
        fields: ["nip", "sk_id"],
        name: "nip_sk",
      },
    ],
    defaultScope: {
      order: [
        ["golongan", "asc"],
        ["nip", "asc"],
      ],
    },
    scopes: {
      pegawai: {
        include: [
          {
            association: "SuratKeputusan",
            where: {
              status: "publish",
            },
          },
        ],
      },
      kantor: {
        include: [
          {
            association: "KantorAsal",
            attributes: ["kode_satker", "kantor"],
          },
          {
            association: "KantorTujuan",
            attributes: ["kode_satker", "kantor"],
          },
        ],
      },
    },
  }
);

export default PegawaiMutasi;
