import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

type FaqAttributes = {
  id: string;
  question: string;
  answer: string;
  status: "DRAFT" | "PUBLISH";
  created_at: Date;
};

type FaqCreationAttributes = Optional<FaqAttributes, "id"| "status" | "created_at">;

class Faq
  extends Model<FaqAttributes, FaqCreationAttributes>
  implements FaqAttributes
{
  public id!: string;
  public question!: string;
  public answer!: string;
  public status!: "DRAFT" | "PUBLISH";
  public created_at!: Date;
}

Faq.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "PUBLISH"),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "faq",
    modelName: "Faq",
  }
);

export default Faq;