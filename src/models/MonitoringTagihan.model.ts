import sequelize from "@/config/db.config";
import { Model, DataTypes, BelongsTo } from "sequelize";
import PegawaiMutasi from "./PegawaiMutasi.model";
type MonitoringTagihanAttributes = {
  pegawai_id: string;
  nama: string;
  total_tagihan: number;
  total_termin: number;
  sisa_tagihan: number;
};

class MonitoringTagihan
  extends Model<MonitoringTagihanAttributes>
  implements MonitoringTagihanAttributes
{
  public pegawai_id!: string;
  public nama!: string;
  public total_tagihan!: number;
  public total_termin!: number;
  public sisa_tagihan!: number;

  public Pegawai!: PegawaiMutasi;

  public static associations: {
    Pegawai: BelongsTo<MonitoringTagihan, any>;
  };
}


MonitoringTagihan.init(
  {
    pegawai_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: PegawaiMutasi,
        key: "id",
      },
      primaryKey: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_tagihan: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    total_termin: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    sisa_tagihan: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "monitoring_tagihan",
    modelName: "MonitoringTagihan",
  }
);
export default MonitoringTagihan;