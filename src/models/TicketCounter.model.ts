import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, Association, BelongsTo } from "sequelize";

type TicketCounterAttributes = {
  year_month: string;
  last_number: number;
};

type TicketCounterCreationAttributes = Optional<
  TicketCounterAttributes,
  "last_number"
>;

class TicketCounter
  extends Model<TicketCounterAttributes | TicketCounterCreationAttributes>
  implements TicketCounterAttributes
{
  public year_month!: string;
  public last_number!: number;
}

TicketCounter.init(
  {
    year_month: {
      type: DataTypes.STRING(6),
      primaryKey: true,
      validate: {
        is: {
          args: /^[0-9]{4}(0[1-9]|1[0-2])$/,
          msg: "year_month must be YYYYMM",
        },
      },
    },
    last_number: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    tableName: "tiket_counter",
    modelName: "TiketCounter",
    sequelize,
  }
);

export default TicketCounter;
