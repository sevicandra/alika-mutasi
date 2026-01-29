import { DataTypes, Model, Op, Optional } from "sequelize";
import sequelize from "@/config/db.config";

type RefHubunganKeluargaAttributes = {
  id: number;
  kode: string;
  nama: string;
  jenis: "PASANGAN" | "ANAK" | "LAINNYA";
};

type RefHubunganKeluargaCreationAttributes = Optional<
  RefHubunganKeluargaAttributes,
  "id" | "jenis"
>;
class RefHubunganKeluarga
  extends Model<RefHubunganKeluargaAttributes, RefHubunganKeluargaCreationAttributes>
  implements RefHubunganKeluargaAttributes
{
  public id!: number;
  public kode!: string;
  public nama!: string;
  public jenis!: "PASANGAN" | "ANAK" | "LAINNYA";
}
RefHubunganKeluarga.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: "kode",
        msg: "Kode sudah ada",
      },
      validate: {
        notNull: {
          msg: "Kode tidak boleh kosong",
        },
      },
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
    jenis: {
      type: DataTypes.ENUM("PASANGAN", "ANAK", "LAINNYA"),
      allowNull: false,
      defaultValue: "LAINNYA",
      validate: {
        notNull: {
          msg: "Jenis tidak boleh kosong",
        },
        isIn: {
          args: [["PASANGAN", "ANAK", "LAINNYA"]],
          msg: "Jenis tidak valid",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "ref_hubungan_keluarga",
    modelName: "RefHubunganKeluarga",
    timestamps: false,
    scopes: {
      keluargaInti: {
        where: {
          [Op.or]: [{ jenis: "PASANGAN" }, { jenis: "ANAK" }],
        },
      },
      anak: {
        where: {
          [Op.or]: [{ jenis: "ANAK" }],
        },
      },
      pasangan: {
        where: {
          [Op.or]: [{ jenis: "PASANGAN" }],
        },
      },
    },
  }
);
export default RefHubunganKeluarga;
