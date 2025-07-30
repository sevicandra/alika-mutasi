import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

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
      validate: {
        isIn: {
          args: [["PPK", "BENDAHARA"]],
          msg: "Jenis jabatan tidak valid",
        },
        notNull: {
          msg: "Jenis jabatan tidak boleh kosong",
        },
      }
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: {
          msg: "Nama tidak boleh kosong",
        },
      },
    },
    nip: {
      type: DataTypes.STRING(18),
      allowNull: false,
      validate: {
        is: {
          args: "^(19[6-9]\\d|20\\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2]\\d|3[0-1])(19[8-9]\\d|20\\d{2})(0[1-9]|1[0-2])([1-2])(\\d{3})$",
          msg: "NIP must be 18 digits long.",
        },
        notNull: {
          msg: "NIP tidak boleh kosong",
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
