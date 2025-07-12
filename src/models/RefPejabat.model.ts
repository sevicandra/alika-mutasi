import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Association } from "sequelize";

type RefPejabatAttributes = {
  id: number;
  jenis: "PPK" | "BENDAHARA";
  nama: string;
  nip: string;
};

type RefPejabatCreationAttributes = Optional<RefPejabatAttributes, "id">;

class RefPejabat
  extends Model<RefPejabatAttributes, RefPejabatCreationAttributes>
  implements RefPejabatAttributes
{
  public id!: number;
  public jenis!: "PPK" | "BENDAHARA";
  public nama!: string;
  public nip!: string;
}

RefPejabat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jenis: {
      type: DataTypes.ENUM("PPK", "BENDAHARA"),
      allowNull: false,
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nip: {
      type: DataTypes.STRING(18),
      allowNull: false,
      validate: {
        is: {
          args: /^[0-9]{18}$/,
          msg: "NIP must be 18 digits long.",
        },
      },
    },
  },
  {
    sequelize,
    modelName: "RefPejabat",
    tableName: "ref_pejabat",
    timestamps: false,
  }
);

export default RefPejabat;
