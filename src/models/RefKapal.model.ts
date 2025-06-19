import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";
import Kota from "./RefKota.model";

type RefKapalAttributes = {
  id: number;
  rute: string;
  kapal: string;
  kota_asal: string;
  kota_tujuan: string;
  tarif: number;
};

type RefKapalCreationAttributes = Optional<RefKapalAttributes, "id">;
class RefKapal extends Model<RefKapalAttributes, RefKapalCreationAttributes> {
  public id!: number;
  public rute!: string;
  public kapal!: string;
  public kota_asal!: string;
  public kota_tujuan!: string;
  public tarif!: number;

  public static associations: {
    KotaAsal: BelongsTo<Kota, RefKapal>;
    KotaTujuan: BelongsTo<Kota, RefKapal>;
  };

  public KotaAsal!: Kota;
  public KotaTujuan!: Kota;
}

RefKapal.init(
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
    kapal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kota_asal: {
      type: DataTypes.STRING(4),
      allowNull: false,
      references: {
        model: Kota,
        key: "kode",
      },
      validate: {
        is: { args: /^[0-9]{4}$/, msg: "Kode kota asal harus 4 digit angka" },
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    kota_tujuan: {
      type: DataTypes.STRING(4),
      allowNull: false,
      references: {
        model: Kota,
        key: "kode",
      },
      validate: {
        is: { args: /^[0-9]{4}$/, msg: "Kode kota asal harus 4 digit angka" },
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    tarif: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ref_kapal",
    modelName: "RefKapal",
    timestamps: false,
  }
);


export default RefKapal;
