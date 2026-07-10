import { BelongsTo, DataTypes, Model, Optional } from "sequelize";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import Keluarga from "./Keluarga.model";
import Sanggah from "./Sanggah.model";

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

  public Sanggah!: Sanggah;
  public Ref!: Keluarga;

  public static associations: {
    Sanggah: BelongsTo<DataSanggah, Sanggah>;
    Ref: BelongsTo<DataSanggah, Keluarga>;
  };
}

DataSanggah.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: () => UUID.v7(),
      primaryKey: true,
    },
    sanggah_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "sanggah_keluarga",
        msg: "keluarga_id sudah ada",
      },
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
        model: Sanggah,
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
      unique: {
        name: "sanggah_keluarga",
        msg: "keluarga_id sudah ada",
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
    indexes: [
      {
        type: "UNIQUE",
        fields: ["sanggah_id", "keluarga_id"],
        name: "sanggah_keluarga",
      },
    ],
  }
);

export default DataSanggah;
