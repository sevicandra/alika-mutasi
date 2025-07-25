import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

type PayrollCounterAttributes = {
  sk_id: string;
  last_number: number;
};


type PayrollCounterCreationAttributes = Optional<
  PayrollCounterAttributes,
  "last_number"
>;

class PayrollCounter
  extends Model<PayrollCounterAttributes, PayrollCounterCreationAttributes>
  implements PayrollCounterAttributes
{
  public sk_id!: string;
  public last_number!: number;
}


PayrollCounter.init(
  {
    sk_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    last_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "payroll_counter",
    modelName: "PayrollCounter",
    timestamps: false,
  }
);

export default PayrollCounter;