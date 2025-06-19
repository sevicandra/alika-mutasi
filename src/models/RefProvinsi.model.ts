import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Op, Association } from "sequelize";
import Kota from "./RefKota.model";
import UangHarian from "./RefUangHarian.model";
type ProvinsiAttributes = {
  id: number;
  kode: string;
  provinsi: string;
};
type ProvinsiCreationAttributes = Optional<ProvinsiAttributes, "id">;
class Provinsi
  extends Model<ProvinsiAttributes, ProvinsiCreationAttributes>
  implements ProvinsiAttributes
{
  public id!: number;
  public kode!: string;
  public provinsi!: string;
  public Kota!: Kota[];
  public UangHarian!: UangHarian;

  public static associations: {
    Kota: Association<Provinsi, Kota>;
    UangHarian: Association<Provinsi, UangHarian>;
  };
}

Provinsi.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode: {
      type: DataTypes.STRING(4),
      allowNull: false,
      unique: true,
      validate: {
        len: [4, 4],
        is: /^[0-9]{4}$/,
      },
    },
    provinsi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ref_provinsi",
    modelName: "RefProvinsi",
    timestamps: false,
    defaultScope: {
      order: [["kode", "ASC"]],
    },
  }
);

export default Provinsi;
