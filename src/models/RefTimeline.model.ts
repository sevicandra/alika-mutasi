import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

type RefTimelineAttributes = {
  id: number;
  kode: string;
  nama: string;
  urutan: number;
};

type RefTimelineCreationAttributes = Optional<RefTimelineAttributes, "id">;

export class RefTimeline
  extends Model<RefTimelineAttributes, RefTimelineCreationAttributes>
  implements RefTimelineAttributes
{
  public id!: number;
  public kode!: string;
  public nama!: string;
  public urutan!: number;
}

RefTimeline.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    kode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ref_timeline",
    modelName: "RefTimeline",
    timestamps: false,
  }
);

export default RefTimeline;
