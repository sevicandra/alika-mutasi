import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Association, BelongsTo } from "sequelize";

type SpdCounterAttributes = {
  year: string;
  ext: string;
  last_number: number;
};

type SpdCounterCreationAttributes = Optional<
  SpdCounterAttributes,
  "last_number" | "year"
>;

class SpdCounter
  extends Model<SpdCounterAttributes | SpdCounterCreationAttributes>
  implements SpdCounterAttributes
{
  public year!: string;
  public ext!: string;
  public last_number!: number;
}

SpdCounter.init(
  {
    year: {
      type: DataTypes.STRING(4),
      primaryKey: true,
      validate: {
        is: {
          args: /^[0-9]{4}$/,
          msg: "year must be YYYY",
        },
      },
      defaultValue: new Date().getFullYear(),
    },
    ext: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    last_number: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    tableName: "spd_counter",
    modelName: "SpdCounter",
    sequelize,
  }
);

export default SpdCounter;
