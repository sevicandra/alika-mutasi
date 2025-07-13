import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";
import PegawaiMutasi from "./PegawaiMutasi.model";
import RefHubunganKeluarga from "./RefHubunganKeluarga.model";

type KeluargaAttributes = {
  id: string;
  hris_id: number;
  pegawai_id: string;
  nik?: string;
  nama: string;
  hubungan: string;
  tanggal_lahir: Date;
  pekerjaan?: string;
  is_invant: boolean;
  status: string;
  file: string | null;
};

type KeluargaCreationAttributes = Optional<
  KeluargaAttributes,
  "id" | "status" | "hris_id" | "file"
>;

class Keluarga
  extends Model<KeluargaAttributes, KeluargaCreationAttributes>
  implements KeluargaAttributes
{
  public id!: string;
  public hris_id!: number;
  public pegawai_id!: string;
  public nik?: string;
  public nama!: string;
  public hubungan!: string;
  public tanggal_lahir!: Date;
  public pekerjaan?: string;
  public is_invant!: boolean;
  public status!: string;
  public file!: string | null;

  public Pegawai!: PegawaiMutasi;
  public Ref!: RefHubunganKeluarga;

  public static associations: {
    Pegawai: BelongsTo<Keluarga, PegawaiMutasi>;
    Ref: BelongsTo<Keluarga, RefHubunganKeluarga>;
  };
}
Keluarga.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hris_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pegawai_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: PegawaiMutasi,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    nik: {
      type: DataTypes.STRING(16),
      allowNull: true,
      validate: {
        is: { args: /^[0-9]{16}|[]{0}$/, msg: "NIK must be 16 digits" },
      },
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hubungan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: RefHubunganKeluarga,
        key: "kode",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    tanggal_lahir: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pekerjaan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_invant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("TERTANGGUNG", "TIDAK_TERTANGGUNG"),
      allowNull: false,
      defaultValue: "TIDAK_TERTANGGUNG",
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "keluarga",
    modelName: "Keluarga",
    timestamps: false,
  }
);

export default Keluarga;
