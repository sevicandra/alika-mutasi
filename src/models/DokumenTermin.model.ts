import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo, HasMany, HasOne } from "sequelize";
import Termin from "./Termin.model";
import TteDokumen from "./TteDokumen.model";
import { EsignService } from "@/services/esign.service";

type DokumenTerminAttributes = {
  id: string;
  termin_id: string;
  document_type: string;
  file: string|null;
  required: boolean;
  uploadable: boolean;
  process: "IDLE" | "PROCESSING";
  processed_by: string;
};

type DokumenTerminCreationAttributes = Optional<
  DokumenTerminAttributes,
  "id" | "process" | "processed_by" | "file"
>;

class DokumenTermin
  extends Model<DokumenTerminAttributes, DokumenTerminCreationAttributes>
  implements DokumenTerminAttributes
{
  public id!: string;
  public termin_id!: string;
  public document_type!: string;
  public file!: string|null;
  public required!: boolean;
  public uploadable!: boolean;
  public process!: "IDLE" | "PROCESSING";
  public processed_by!: string;

  public Termin!: Termin;
  public Tte!: TteDokumen[];
  public TtePegawai!: TteDokumen;

  static associations: {
    Termin: BelongsTo<DokumenTermin, Termin>;
    Tte: HasMany<TteDokumen, Termin>;
    TtePegawai: HasOne<TteDokumen, Termin>;
  };
}

DokumenTermin.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    termin_id: {
      type: DataTypes.STRING,
      references: {
        model: Termin,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      allowNull: false,
    },
    document_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    uploadable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    process: {
      type: DataTypes.ENUM("IDLE", "PROCESSING"),
      allowNull: false,
      defaultValue: "IDLE",
    },
    processed_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "DokumenTermin",
    tableName: "dokumen_termin",
  }
);

export default DokumenTermin;
