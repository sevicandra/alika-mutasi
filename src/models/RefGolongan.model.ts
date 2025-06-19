import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";

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
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
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