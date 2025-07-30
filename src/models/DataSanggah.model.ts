import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes, BelongsTo } from "sequelize";
import RevisiKeluarga from "./Sanggah.model";
import Keluarga from "./Keluarga.model";

type DataSanggahAttributes = {
  id: string;
  sanggah_id: string;
  action: "EDIT" | "REMOVE" | "ADD";
  keluarga_id: string;
  new_value: JSON;
  reason: string;
  admin_notes: string;
  is_approved: boolean;
  file: string;
};

type DataSanggahCreationAttributes = Optional<
  DataSanggahAttributes,
  "id" | "is_approved" | "new_value" | "keluarga_id" | "file" | "reason" | "admin_notes"
>;

class DataSanggah
  extends Model<DataSanggahAttributes, DataSanggahCreationAttributes>
  implements DataSanggahAttributes
{
  public id!: string;
  public sanggah_id!: string;
  public action!: "EDIT" | "REMOVE" | "ADD";
  public keluarga_id!: string;
  public status!: "PENDING" | "APPROVED" | "REJECTED";
  public new_value!: JSON;
  public reason!: string;
  public admin_notes!: string;
  public is_approved!: boolean;
  public file!: string;

  public Sanggah!: RevisiKeluarga;
  public Ref!: Keluarga;

  public static associations: {
    Sanggah: BelongsTo<DataSanggah, RevisiKeluarga>;
    Ref: BelongsTo<DataSanggah, Keluarga>;
  };
}

DataSanggah.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sanggah_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUUID: {
          msg: "sanggah_id harus UUID",
          args: 4,
        },
        notEmpty: {
          msg: "sanggah_id tidak boleh kosong",
        },
      },
      references: {
        model: RevisiKeluarga,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    action: {
      type: DataTypes.ENUM("EDIT", "REMOVE", "ADD"),
      validate: {
        isIn: {
          msg: "action harus salah satu dari EDIT, REMOVE, ADD",
          args: [["EDIT", "REMOVE", "ADD"]],
        },
        notEmpty: {
          msg: "action tidak boleh kosong",
        },
      },
      allowNull: false,
    },
    keluarga_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: Keluarga,
        key: "id",
      },
      validate: {
        isUUID: {
          msg: "keluarga_id harus UUID",
          args: 4,
        },
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    new_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admin_notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "DataSanggah",
    tableName: "data_sanggah",
  }
);

export default DataSanggah;
