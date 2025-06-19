import sequelize from "@/config/db.config";
import {
  Model,
  Optional,
  DataTypes,
  BelongsTo,
} from "sequelize";

import PegawaiMutasi from "./PegawaiMutasi.model";

type PerubahanKeluargaAttributes = {
  id: string;
  pegawai_id: string;
  changed_field: JSON | null;
  revisi_id: string | null;
  changed_by: string;
  changed_at: Date;
};

type PerubahanKeluargaCreationAttributes = Optional<
  PerubahanKeluargaAttributes,
  "id" | "changed_at" | "revisi_id"
>;

class PerubahanKeluarga
  extends Model<
    PerubahanKeluargaAttributes,
    PerubahanKeluargaCreationAttributes
  >
  implements PerubahanKeluargaAttributes
{
  public id!: string;
  public pegawai_id!: string;
  public changed_field!: JSON | null;
  public revisi_id!: string | null;
  public changed_by!: string;
  public changed_at!: Date;

  public static associations: {
    Pegawai: BelongsTo<PerubahanKeluarga, PegawaiMutasi>;
  };
  public Pegawai!: BelongsTo<PerubahanKeluarga, PegawaiMutasi>;
}

PerubahanKeluarga.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    pegawai_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changed_field: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    revisi_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    changed_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "perubahan_keluarga",
    modelName: "PerubahanKeluarga",
  }
);


export default PerubahanKeluarga;