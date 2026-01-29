import { Association, DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
import PegawaiMutasi from "./PegawaiMutasi.model";
import Timeline from "./Timeline.model";

type SuratKeputusanAttributes = {
  id: string;
  nomor: string;
  uraian: string;
  tanggal: Date;
  tmt: Date;
  jenjang: string;
  status: "DRAFT" | "PUBLISH" | "SELESAI";
  file: string;
};

type SuratKeputusanCreationAttributes = Optional<
  SuratKeputusanAttributes,
  "id" | "file" | "status"
>;

class SuratKeputusan
  extends Model<SuratKeputusanAttributes, SuratKeputusanCreationAttributes>
  implements SuratKeputusanAttributes
{
  public id!: string;
  public nomor!: string;
  public uraian!: string;
  public tanggal!: Date;
  public status!: "DRAFT" | "PUBLISH" | "SELESAI";
  public tmt!: Date;
  public jenjang!: string;
  public file!: string;

  public Pegawai!: PegawaiMutasi[] | [];
  public Timeline!: Timeline[] | [];

  public static associations: {
    Pegawai: Association<SuratKeputusan, PegawaiMutasi>;
  };
  async addPegawai({
    golongan,
    kantor_asal,
    kantor_tujuan,
    nip,
    nama,
  }: {
    golongan: string;
    kantor_asal: string;
    kantor_tujuan: string;
    nip: string;
    nama: string;
  }) {
    return await PegawaiMutasi.create({
      sk_id: this.id,
      golongan: golongan,
      kantor_asal: kantor_asal,
      kantor_tujuan: kantor_tujuan,
      nip: nip,
      nama: nama,
    });
  }
}

SuratKeputusan.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nomor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uraian: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tmt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    jenjang: {
      type: DataTypes.ENUM(
        "ESELON I",
        "ESELON II",
        "ESELON III",
        "ESELON IV",
        "JABATAN FUNGSIONAL",
        "PELAKSANA",
        "PENSIUN"
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "PUBLISH", "SELESAI"),
      defaultValue: "DRAFT",
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "surat_keputusan",
    modelName: "SuratKeputusan",
    timestamps: false,
    defaultScope: {
      order: [
        ["tanggal", "desc"],
        ["nomor", "desc"],
      ],
    },
  }
);

export default SuratKeputusan;
