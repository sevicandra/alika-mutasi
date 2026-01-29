import { Association, DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
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
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: {
        name: "kode",
        msg: "Kode provinsi sudah ada",
      },
      validate: {
        is: {
          args: /^[0-9]{3}$/,
          msg: "Kode provinsi harus angka 3 digit",
        },
        notNull: {
          msg: "Kode provinsi tidak boleh kosong",
        },
      },
    },
    provinsi: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Nama provinsi tidak boleh kosong",
        },
      },
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
