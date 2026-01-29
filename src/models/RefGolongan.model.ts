import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";

type RefGolonganAttributes = {
  id: number;
  kode: string;
  nama: number;
};

type RefGolonganCreationAttributes = Optional<RefGolonganAttributes, "id">;

class RefGolongan
  extends Model<RefGolonganAttributes, RefGolonganCreationAttributes>
  implements RefGolonganAttributes
{
  public id!: number;
  public kode!: string;
  public nama!: number;
}

RefGolongan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "kode",
        msg: "Kode golongan sudah ada",
      },
      validate: {
        is: {
          args: "^([1-3][A-D]|4[A-E])$",
          msg: "Kode golongan harus berupa angka dan huruf yang valid",
        },
        notNull: {
          msg: "Kode golongan tidak boleh kosong",
        },
      },
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Nama golongan tidak boleh kosong",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "ref_golongan",
    modelName: "RefGolongan",
    timestamps: false,
  }
);

export default RefGolongan;
