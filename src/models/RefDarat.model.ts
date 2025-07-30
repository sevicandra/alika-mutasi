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
      unique: {
        name: "rute",
        msg: "Rute sudah ada",
      },
      validate: {
        notNull: {
          msg: "Rute tidak boleh kosong",
        },
      },
    },
    kota_asal: {
      type: DataTypes.STRING(5),
      allowNull: false,
      validate: {
        is: { args: /^[0-9]{5}$/, msg: "Kode kota harus angka 5 digit" },
      },
      references: {
        model: Kota,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    kota_tujuan: {
      type: DataTypes.STRING(5),
      allowNull: false,
      validate: {
        is: { args: /^[0-9]{5}$/, msg: "Kode kota harus angka 5 digit" },
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
      validate: {
        isPositive: {
          msg: "Jarak harus lebih dari 0",
        },
        notNull: {
          msg: "Jarak tidak boleh kosong",
        },
      },
    },
    pulau: {
      type: DataTypes.ENUM("JAWA", "LUAR_JAWA"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["JAWA", "LUAR_JAWA"]],
          msg: "Pulau tidak valid",
        },
        notNull: {
          msg: "Pulau tidak boleh kosong",
        },
      },
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
