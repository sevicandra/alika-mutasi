import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Op, Association } from "sequelize";
import PegawaiMutasi from "./PegawaiMutasi.model";

type RincianBiayaAttributes = {
  id: string;
  pegawai_id: string;
  volume: number;
  harga_satuan: number;
  jenis: string;
  sub_jenis: string;
  keterangan: string;
  urutan?: number;
};

type RincianBiayaCreationAttributes = Optional<
  RincianBiayaAttributes,
  "id" | "urutan"
>;

class RincianBiaya
  extends Model<RincianBiayaAttributes, RincianBiayaCreationAttributes>
  implements RincianBiayaAttributes
{
  public id!: string;
  public pegawai_id!: string;
  public volume!: number;
  public harga_satuan!: number;
  public jenis!: string;
  public sub_jenis!: string;
  public keterangan!: string;
  public urutan?: number;
}

RincianBiaya.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    pegawai_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: PegawaiMutasi,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    volume: {
      type: DataTypes.DOUBLE(5, 2),
      allowNull: false,
    },
    harga_satuan: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
    },
    jenis: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [
            [
              "BIAYA_ANGKUT_ORANG",
              "BIAYA_ANGKUT_BARANG",
              "UANG_HARIAN",
              "BIAYA_ANGKUT_ORANG_ART",
              "BIAYA_ANGKUT_BARANG_ART",
              "UANG_HARIAN_ART",
            ],
          ],
          msg: "Invalid jenis",
        },
      },
      allowNull: false,
    },
    sub_jenis: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "rincian_biaya",
    modelName: "RincianBiaya",
    timestamps: false,
  }
);

export default RincianBiaya;
