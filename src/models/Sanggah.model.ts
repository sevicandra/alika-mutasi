import { BelongsTo, DataTypes, HasMany, Model, Optional } from "sequelize";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import DataSanggah from "./DataSanggah.model";
import PegawaiMutasi from "./PegawaiMutasi.model";

type SanggahAttributes = {
  id: string;
  ticket_number: string;
  pegawai_id: string;
  status: "DRAFT" | "PENDING" | "REVIEWED";
  admin_notes?: string;
  submitted_at?: Date;
  reviewed_at?: Date;
};

type SanggahCreationAttributes = Optional<SanggahAttributes, "id">;

class Sanggah
  extends Model<SanggahAttributes, SanggahCreationAttributes>
  implements SanggahAttributes
{
  public id!: string;
  public ticket_number!: string;
  public pegawai_id!: string;
  public status!: "DRAFT" | "PENDING" | "REVIEWED";
  public admin_notes?: string;
  public submitted_at?: Date;
  public reviewed_at?: Date;

  public Pegawai!: PegawaiMutasi;
  public DataSanggah!: DataSanggah[];

  public static associations: {
    Pegawai: BelongsTo<Sanggah, PegawaiMutasi>;
    DataSanggah: HasMany<Sanggah, DataSanggah>;
  };
}

Sanggah.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: () => UUID.v7(),
      primaryKey: true,
    },
    ticket_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    pegawai_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "PENDING", "REVIEWED"),
      defaultValue: "DRAFT",
      allowNull: false,
    },
    admin_notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "sanggah",
    modelName: "Sanggah",
  }
);

export default Sanggah;
