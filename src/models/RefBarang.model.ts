import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

type RefBarangAttributes = {
  id: number;
  golongan: string;
  status:
    | "TIDAK_BERKELUARGA"
    | "BERKELUARGA_TANPA_ANAK"
    | "BERKELUARGA_DENGAN_ANAK";
  volume: number;
  createdAt: Date;
};

type RefBarangCreationAttributes = Optional<
  RefBarangAttributes,
  "id" | "createdAt"
>;

class RefBarang
  extends Model<RefBarangAttributes, RefBarangCreationAttributes>
  implements RefBarangAttributes
{
  public id!: number;
  public golongan!: string;
  public status!:
    | "TIDAK_BERKELUARGA"
    | "BERKELUARGA_TANPA_ANAK"
    | "BERKELUARGA_DENGAN_ANAK";
  public volume!: number;
  readonly createdAt!: Date;
}

RefBarang.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    golongan: {
      type: DataTypes.STRING(1),
      allowNull: false,
      validate: {
        is: { args: /^[0-9]{1}$/, msg: "kode golongan harus angka 1 digit" },
      },
    },
    status: {
      type: DataTypes.ENUM(
        "TIDAK_BERKELUARGA",
        "BERKELUARGA_TANPA_ANAK",
        "BERKELUARGA_DENGAN_ANAK"
      ),
      allowNull: false,
    },
    volume: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "ref_barang",
    modelName: "RefBarang",
    createdAt: "createdAt",
    updatedAt: false,
  }
);

export default RefBarang;