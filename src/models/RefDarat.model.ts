import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";
import Kota from "./RefKota.model";

type RefDaratAttributes = {
  id: number;
  rute: string;
  kota_asal: string;
  kota_tujuan: string;
  jarak: number;
  pulau: "JAWA" | "LUAR_JAWA";
};

type RefDaratCreationAttributes = Optional<RefDaratAttributes, "id">;

class RefDarat
  extends Model<RefDaratAttributes, RefDaratCreationAttributes>
  implements RefDaratAttributes
{
  public id!: number;
  public rute!: string;
  public kota_asal!: string;
  public kota_tujuan!: string;
  public jarak!: number;
  public pulau!: "JAWA" | "LUAR_JAWA";

  public static associations: {
    KotaAsal: BelongsTo<Kota, RefDarat>;
    KotaTujuan: BelongsTo<Kota, RefDarat>;
  };

  public KotaAsal!: Kota;
  public KotaTujuan!: Kota;
}

RefDarat.init(
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
        is: /^[0-9]{4}$/, // Jika kode kota harus angka 4 digit
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
        is: /^[0-9]{4}$/, // Jika kode kota harus angka 4 digit
      },
      references: {
        model: Kota,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    jarak: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pulau: {
      type: DataTypes.ENUM("JAWA", "LUAR_JAWA"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ref_darat",
    modelName: "RefDarat",
    timestamps: false,
  }
);


export default RefDarat;
