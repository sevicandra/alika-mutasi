import { Association, DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
import Kantor from "./RefKantor.model";
import Provinsi from "./RefProvinsi.model";

type KotaAttributes = {
  id: number;
  kode_provinsi: string;
  kode: string;
  kota: string;
};
type KotaCreationAttributes = Optional<KotaAttributes, "id">;

class Kota extends Model<KotaAttributes, KotaCreationAttributes> implements KotaAttributes {
  public id!: number;
  public kode_provinsi!: string;
  public kode!: string;
  public kota!: string;

  public Provinsi!: Provinsi;
  public Kantor?: Kantor | null;
  public static associations: {
    Provinsi: Association<Kota, Provinsi>;
    Kantor: Association<Kota, Kantor>;
  };
}

Kota.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode_provinsi: {
      type: DataTypes.STRING(3),
      allowNull: false,
      validate: {
        is: { args: /^[0-9]{3}$/, msg: "Kode provinsi harus angka 3 digit" },
        notNull: {
          msg: "Kode provinsi tidak boleh kosong",
        },
      },
      references: {
        model: Provinsi,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    kode: {
      type: DataTypes.STRING(5),
      allowNull: false,
      unique: {
        name: "kode",
        msg: "Kode kota sudah ada",
      },
      validate: {
        is: { args: /^[0-9]{5}$/, msg: "Kode kota harus angka 5 digit" },
        notNull: {
          msg: "Kode kota tidak boleh kosong",
        },
      },
    },
    kota: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Nama kota tidak boleh kosong",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "ref_kota",
    modelName: "RefKota",
    timestamps: false,
    defaultScope: {
      order: [["kode", "ASC"]],
    },
  }
);

export default Kota;
