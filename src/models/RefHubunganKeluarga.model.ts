import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Op, BelongsTo } from "sequelize";

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
  extends Model<
    RefHubunganKeluargaAttributes,
    RefHubunganKeluargaCreationAttributes
  >
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
      unique: true,
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    jenis: {
      type: DataTypes.ENUM("PASANGAN", "ANAK", "LAINNYA"),
      allowNull: false,
      defaultValue: "LAINNYA",
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
      anak : {
        where: {
          [Op.or]: [{ jenis: "ANAK" }],
        },
      },
      pasangan : {
        where: {
          [Op.or]: [{ jenis: "PASANGAN" }],
        },
      },
    },
  }
);
export default RefHubunganKeluarga;
