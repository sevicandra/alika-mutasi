import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Op, Association } from "sequelize";

type RefTerminAttributes = {
  id: number;
  kode: string;
  nama: string;
  required_doc: JSON;
  urutan: number;
};

type RefTerminCreationAttributes = Optional<RefTerminAttributes, "id">;

class RefTermin
  extends Model<RefTerminAttributes, RefTerminCreationAttributes>
  implements RefTerminAttributes
{
  public id!: number;
  public kode!: string;
  public nama!: string;
  public required_doc!: JSON;
  public urutan!: number;
}

RefTermin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    required_doc: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
  },
  {
    sequelize,
    tableName: "ref_termin",
    modelName: "RefTermin",
    timestamps: false,
  }
);

export default RefTermin;

