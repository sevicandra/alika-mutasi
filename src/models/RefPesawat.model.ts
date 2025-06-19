import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";
import Kota from "./RefKota.model";

type RefPesawatAttributes = {
  id: number;
  kota_asal: string;
  kota_tujuan: string;
  ekonomi: number;
  bisnis: number;
  rute: string;
  jenis_tarif: string;
};

type RefPesawatCreationAttributes = Optional<
  RefPesawatAttributes,
  "id" | "jenis_tarif"
>;

class RefPesawat
  extends Model<RefPesawatAttributes, RefPesawatCreationAttributes>
  implements RefPesawatAttributes
{
  public id!: number;
  public kota_asal!: string;
  public kota_tujuan!: string;
  public ekonomi!: number;
  public bisnis!: number;
  public rute!: string;
  public jenis_tarif!: string;

  public KotaAsal!: Kota;
  public KotaTujuan!: Kota;

  public static associations: {
    KotaAsal: BelongsTo<Kota, RefPesawat>;
    KotaTujuan: BelongsTo<Kota, RefPesawat>;
  };
}

RefPesawat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rute: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kota_asal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      validate: {
        len: [4, 4],
        is: /^[0-9]{4}$/,
      },
      references: {
        model: Kota,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    kota_tujuan: {
      type: DataTypes.STRING(4),
      allowNull: false,
      validate: {
        len: [4, 4],
        is: /^[0-9]{4}$/,
      },
      references: {
        model: Kota,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    ekonomi: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
    },
    bisnis: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
    },
    jenis_tarif: {
      type: DataTypes.ENUM("SBM", "NON_SBM"),
      allowNull: false,
      defaultValue: "SBM",
    },
  },
  {
    sequelize,
    tableName: "ref_pesawat",
    modelName: "RefPesawat",
    timestamps: false,
  }
);

export default RefPesawat;
