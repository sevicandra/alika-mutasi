import sequelize from "@/config/db.config";
import {
  Model,
  Optional,
  DataTypes,
  Op,
  Association,
  BelongsTo,
} from "sequelize";
import Termin from "./Termin.model";
import RefTermin from "./RefTermin.model";

type DokumenTerminAttributes = {
  id: string;
  termin_id: string;
  document_type: string;
  ref_termin: string;
  file: string;
};

type DokumenTerminCreationAttributes = Optional<DokumenTerminAttributes, "id">;

class DokumenTermin
  extends Model<DokumenTerminAttributes, DokumenTerminCreationAttributes>
  implements DokumenTerminAttributes
{
  public id!: string;
  public termin_id!: string;
  public document_type!: string;
  public ref_termin!: string;
  public file!: string;

  public Termin!: Termin;
  public RefTermin!: RefTermin;

  static associations: {
    Termin: BelongsTo<DokumenTermin, Termin>;
    RefTermin: BelongsTo<DokumenTermin, RefTermin>;
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
    ref_termin: {
      type: DataTypes.STRING(2),
      references: {
        model: RefTermin,
        key: "kode",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "DokumenTermin",
    tableName: "dokumen_termin",
  }
);

export default DokumenTermin;
