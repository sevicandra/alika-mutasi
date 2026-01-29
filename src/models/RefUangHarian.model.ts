import { Association, DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
import Provinsi from "./RefProvinsi.model";

type RefUangHarianAttributes = {
  id: number;
  kode_provinsi: string;
  tarif: number;
};

type RefUangHarianCreationAttributes = Optional<RefUangHarianAttributes, "id">;

class RefUangHarian
  extends Model<RefUangHarianAttributes, RefUangHarianCreationAttributes>
  implements RefUangHarianAttributes
{
  public id!: number;
  public kode_provinsi!: string;
  public tarif!: number;

  public Provinsi!: Provinsi;
  public static associations: {
    Provinsi: Association<RefUangHarian, Provinsi>;
  };
}

RefUangHarian.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode_provinsi: {
      type: DataTypes.STRING(3),
      allowNull: false,
      references: {
        model: Provinsi,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    tarif: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
      validate: {
        notNull: {
          msg: "Tarif tidak boleh kosong",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "ref_uang_harian",
    modelName: "RefUangHarian",
    timestamps: false,
  }
);

export default RefUangHarian;
