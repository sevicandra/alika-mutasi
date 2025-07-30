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
      unique: {
        name: "kode",
        msg: "Kode sudah ada",
      },
      validate: {
        notNull: {
          msg: "Kode tidak boleh kosong",
        },
      },
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Nama tidak boleh kosong",
        },
      },
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: "urutan",
        msg: "Urutan sudah ada",
      },
      validate: {
        notNull: {
          msg: "Urutan tidak boleh kosong",
        },
      },
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
