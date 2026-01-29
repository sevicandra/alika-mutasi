import { BelongsTo, DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
import { PegawaiMutasi } from "./";

type RekeningAttributes = {
  id: string;
  pegawai_id: string;
  nomor_rekening: string;
  nama_rekening: string;
  nama_bank: string;
};

type RekeningCreationAttributes = Optional<RekeningAttributes, "id">;

class Rekening
  extends Model<RekeningAttributes, RekeningCreationAttributes>
  implements RekeningAttributes
{
  public id!: string;
  public pegawai_id!: string;
  public nomor_rekening!: string;
  public nama_rekening!: string;
  public nama_bank!: string;

  public Pegawai!: PegawaiMutasi;

  public static associations: {
    Pegawai: BelongsTo<Rekening, PegawaiMutasi>;
  };
}

Rekening.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pegawai_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nomor_rekening: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_rekening: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_bank: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "rekening",
    modelName: "Rekening",
    timestamps: false,
  }
);

export default Rekening;
