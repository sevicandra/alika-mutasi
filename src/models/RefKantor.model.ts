import sequelize from "@/config/db.config";
import {
  Model,
  Optional,
  DataTypes,
  BelongsTo,
} from "sequelize";
import Kota from "./RefKota.model";

type KantorAttributes = {
  id: number;
  kode_kota: string;
  kode_satker: string;
  kantor: number;
};
type KantorCreationAttributes = Optional<KantorAttributes, "id">;

class Kantor
  extends Model<KantorAttributes, KantorCreationAttributes>
  implements KantorAttributes
{
  public id!: number;
  public kode_kota!: string;
  public kode_satker!: string;
  public kantor!: number;

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
      type: DataTypes.STRING(4),
      allowNull: false,
      validate: {
        len: [4, 4],
        is: /^[0-9]{4}$/,
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
      unique: true,
      validate: {
        len: [6, 6],
        is: /^[0-9]{6}$/,
      },
    },
    kantor: {
      type: DataTypes.STRING(),
      allowNull: false,
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
