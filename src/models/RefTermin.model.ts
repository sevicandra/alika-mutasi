import sequelize from "@/config/db.config";
import { Model, Optional, DataTypes } from "sequelize";

type RefTerminAttributes = {
  id: number;
  kode: string;
  nama: string;
  required_doc: {
    jenis: string;
    required: boolean;
    upload: boolean;
    penandatatangan: string[];
  }[];
  urutan: number;
};

type RefTerminCreationAttributes = Optional<RefTerminAttributes, "id">;

class RefTermin
  extends Model<RefTerminAttributes, RefTerminCreationAttributes>
  implements RefTerminAttributes
{
  public id!: number;
  public kode!: string;
  public nama!: string;
  public required_doc!: {
    jenis: string;
    required: boolean;
    upload: boolean;
    penandatatangan: string[];
  }[];
  public urutan!: number;
}

RefTermin.init(
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
    required_doc: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Dokumen yang diperlukan tidak boleh kosong",
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
    tableName: "ref_termin",
    modelName: "RefTermin",
    timestamps: false,
  }
);

export default RefTermin;
