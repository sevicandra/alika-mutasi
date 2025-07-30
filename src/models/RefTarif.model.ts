import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

type RefTarifAttributes = {
  id: number;
  jenis:
    | "TRANSPORT_DARAT_ORANG"
    | "TRANSPORT_DARAT_BARANG"
    | "PACKING_DARAT"
    | "PACKING_LAUT"
    | "PACKING_UDARA"
    | "UANG_HARIAN";
  tarif: number;
  createdAt?: Date;
};

type RefTarifCreationAttributes = Optional<
  RefTarifAttributes,
  "id" | "createdAt"
>;
class RefTarif
  extends Model<RefTarifAttributes, RefTarifCreationAttributes>
  implements RefTarifAttributes
{
  public id!: number;
  public jenis!:
    | "TRANSPORT_DARAT_ORANG"
    | "TRANSPORT_DARAT_BARANG"
    | "PACKING_DARAT"
    | "PACKING_LAUT"
    | "PACKING_UDARA"
    | "UANG_HARIAN";
  public tarif!: number;
  readonly createdAt?: Date;
}

RefTarif.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jenis: {
      type: DataTypes.ENUM(
        "TRANSPORT_DARAT_ORANG",
        "TRANSPORT_DARAT_BARANG",
        "PACKING_DARAT",
        "PACKING_LAUT",
        "PACKING_UDARA",
        "UANG_HARIAN"
      ),
      allowNull: false,
      validate: {
        notNull: {
          msg: "jenis tidak boleh kosong",
        },
        isIn: {
          args: [
            [
              "TRANSPORT_DARAT_ORANG",
              "TRANSPORT_DARAT_BARANG",
              "PACKING_DARAT",
              "PACKING_LAUT",
              "PACKING_UDARA",
              "UANG_HARIAN",
            ],
          ],
          msg: "Jenis tidak valid",
        },
      },
    },
    tarif: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
      validate: {
        notNull: {
          msg: "tarif tidak boleh kosong",
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "ref_tarif",
    modelName: "RefTarif",
    createdAt: "createdAt",
    updatedAt: false,
    defaultScope: {
      order: [["createdAt", "DESC"]],
    },
  }
);

export default RefTarif;
