import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";
import PegawaiMutasi from "./PegawaiMutasi.model";
import { PembayaranLogAttributes } from "@/types/pembayaranLog";


type PembayaranLogCreationAttributes = Optional<
  PembayaranLogAttributes,
  "id" | "created_at"
>;

class PembayaranLog extends Model<
  PembayaranLogAttributes,
  PembayaranLogCreationAttributes
> {
  public id!: string;
  public pegawai_id!: string;
  public actor_nip!: string | null;
  public actor_role!: string;
  public action!: string;
  public description!: string | null;
  public created_at!: Date;
  public action_type!:
    | "GENERAL_ACTION"
    | "SANGGAHAN_DIAJUKAN"
    | "SANGGAHAN_DIREVIEW";
  public payload!: any; // This will be refined by the union type in PembayaranLogAttributes

  public Pegawai!: PegawaiMutasi;
  public static associations: {
    Pegawai: BelongsTo<PembayaranLog, PegawaiMutasi>;
  };
}

PembayaranLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pegawai_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    actor_nip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actor_role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    action_type: {
      type: DataTypes.ENUM(
        "GENERAL_ACTION",
        "SANGGAHAN_DIAJUKAN",
        "SANGGAHAN_DIREVIEW"
      ),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pembayaran_log",
    modelName: "PembayaranLog",
    timestamps: false,
  }
);

export default PembayaranLog;
