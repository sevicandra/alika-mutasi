import { BelongsTo, DataTypes, Model, Optional } from "sequelize";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import Termin from "./Termin.model";

type PayrollAttributes = {
  id: string;
  termin_id: string;
  tanggal: Date;
  tahap: string;
};

type PayrollCreationAttributes = Optional<PayrollAttributes, "id">;

class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  public id!: string;
  public termin_id!: string;
  public tanggal!: Date;
  public tahap!: string;

  public Termin!: Termin;

  public static associations: {
    Termin: BelongsTo<Payroll, any>;
  };
}

Payroll.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => UUID.v7(),
      primaryKey: true,
    },
    termin_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "termin",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    tahap: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "payroll",
    modelName: "Payroll",
    timestamps: false,
  }
);

export default Payroll;
