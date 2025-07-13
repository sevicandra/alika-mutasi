import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Association } from "sequelize";

import RefTimeline from "./RefTimeline.model";
import SuratKeputusan from "./SuratKeputusan.model";

type TimelineAttributes = {
  id: string;
  sk_id: string;
  ref_kode: string;
  tanggal: Date;
};

type TimelineCreationAttributes = Optional<TimelineAttributes, "id">;

class Timeline extends Model<TimelineAttributes, TimelineCreationAttributes> {
  public id!: string;
  public sk_id!: string;
  public tanggal!: Date;
  public ref_kode!: string;

  public SuratKeputusan!: SuratKeputusan;
  public Ref!: RefTimeline;

  public static associations: {
    SuratKeputusan: Association<Timeline, SuratKeputusan>;
    Ref: Association<Timeline, RefTimeline>;
  };
}

Timeline.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sk_id: {
      type: DataTypes.UUID,
      references: {
        model: "surat_keputusan",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      allowNull: false,
    },
    ref_kode: {
      type: DataTypes.STRING(2),
      references: {
        model: "ref_timeline",
        key: "kode",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
      allowNull: false,
    },

    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "timeline",
    modelName: "Timeline",
    timestamps: false,
  }
);



export default Timeline;