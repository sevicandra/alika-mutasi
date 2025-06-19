import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Association } from "sequelize";
import Kantor from "./RefKantor.model";
import Provinsi from "./RefProvinsi.model";

type KotaAttributes = {
  id: number;
  kode_provinsi: string;
  kode: string;
  kota: string;
};
type KotaCreationAttributes = Optional<KotaAttributes, "id">;

class Kota
  extends Model<KotaAttributes, KotaCreationAttributes>
  implements KotaAttributes
{
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
      type: DataTypes.STRING(4),
      allowNull: false,
      validate: {
        len: [4, 4],
        is: /^[0-9]{4}$/,
      },
      references: {
        model: Provinsi,
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    kode: {
      type: DataTypes.STRING(4),
      allowNull: false,
      unique: true,
      validate: {
        len: [4, 4],
        is: /^[0-9]{4}$/,
      },
    },
    kota: {
      type: DataTypes.STRING,
      allowNull: false,
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
