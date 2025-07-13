import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes,  BelongsTo } from "sequelize";
import PegawaiMutasi from "./PegawaiMutasi.model";

type ArtAttributes = {
  id: string;
  pegawai_id: string;
  nik: string;
  nama: string;
  ktp?: string;
};

type ArtCreationAttributes = Optional<ArtAttributes, "id" | "ktp">;
class Art
  extends Model<ArtAttributes, ArtCreationAttributes>
  implements ArtAttributes
{
  public id!: string;
  public pegawai_id!: string;
  public nik!: string;
  public nama!: string;
  public ktp!: string;

  public Pegawai!: PegawaiMutasi;

  public static associations: {
    Pegawai: BelongsTo<Art, PegawaiMutasi>;
  };
}
Art.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pegawai_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: PegawaiMutasi,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      unique: {
        name: "art",
        msg: "sudah memiliki art",
      },
      validate: {
        isUUID: 4,
        notEmpty: true,
        notNull: {
          msg: "pegawai_id cannot be null",
        },
      },
    },
    nik: {
      type: DataTypes.STRING(16),
      allowNull: true,
      validate: {
        is: { args: /^[0-9]{16}$/, msg: "NIK must be 16 digits" },
      },
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ktp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "art",
    modelName: "Art",
    timestamps: false,
  }
);

export default Art;
