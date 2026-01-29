import { BelongsTo, DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
import Kota from "./RefKota.model";

type KantorAttributes = {
  id: number;
  kode_kota: string;
  kode_satker: string;
  kantor: string;
};
type KantorCreationAttributes = Optional<KantorAttributes, "id">;

class Kantor extends Model<KantorAttributes, KantorCreationAttributes> implements KantorAttributes {
  public id!: number;
  public kode_kota!: string;
  public kode_satker!: string;
  public kantor!: string;

  public Kota!: Kota;
  public static associations: {
    Kota: BelongsTo<Kantor, Kota>;
  };
}
Kantor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode_kota: {
      type: DataTypes.STRING(5),
      allowNull: false,
      validate: {
        is: { args: /^[0-9]{5}$/, msg: "Kode kota harus angka 5 digit" },
        notNull: {
          msg: "Kode kota tidak boleh kosong",
        },
      },
      references: {
        model: "kota",
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    kode_satker: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: {
        name: "kode_satker",
        msg: "Kode satker sudah ada",
      },
      validate: {
        is: { args: /^[0-9]{6}$/, msg: "Kode satker harus angka 6 digit" },
        notNull: {
          msg: "Kode satker tidak boleh kosong",
        },
      },
    },
    kantor: {
      type: DataTypes.STRING(),
      allowNull: false,
      validate: {
        notNull: {
          msg: "Nama kantor tidak boleh kosong",
        },
      },
    },
  },
  {
    sequelize,
    tableName: "ref_kantor",
    modelName: "RefKantor",
    timestamps: false,
  }
);

export default Kantor;
