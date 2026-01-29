import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db.config";
import DokumenTermin from "@/models/DokumenTermin.model";

type TteDokumenAttributes = {
  id: string;
  dokumen_id: string;
  nip: string | null;
  nama: string | null;
  jabatan: "PEGAWAI" | "PEJABAT_KANTOR_ASAL" | "PEJABAT_KANTOR_TUJUAN" | "BENDAHARA" | "PPK";
  koordinat_qr: {
    page: number;
    x: number;
    y: number;
  };
  status: "PENDING" | "PROCESS" | "SIGNED" | "FAILED";
  date: Date | null;
};

type TteDokumenCreationAttributes = Optional<
  TteDokumenAttributes,
  "id" | "date" | "nama" | "nip" | "status"
>;

class TteDokumen
  extends Model<TteDokumenAttributes, TteDokumenCreationAttributes>
  implements TteDokumenAttributes
{
  public id!: string;
  public dokumen_id!: string;
  public nip!: string | null;
  public nama!: string | null;
  public jabatan!:
    | "PEGAWAI"
    | "PEJABAT_KANTOR_ASAL"
    | "PEJABAT_KANTOR_TUJUAN"
    | "BENDAHARA"
    | "PPK";
  public koordinat_qr!: {
    page: number;
    x: number;
    y: number;
  };
  public status!: "PENDING" | "PROCESS" | "SIGNED" | "FAILED";
  public date!: Date | null;

  public Dokumen!: DokumenTermin;
}

TteDokumen.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dokumen_id: {
      type: DataTypes.STRING,
      references: {
        model: DokumenTermin,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      allowNull: false,
    },
    nip: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: true,
        is: {
          args: "^(19[6-9]\\d|20\\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2]\\d|3[0-1])(19[8-9]\\d|20\\d{2})(0[1-9]|1[0-2])([1-2])(\\d{3})$",
          msg: "mohon masukkan nip yang valid",
        },
      },
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jabatan: {
      type: DataTypes.ENUM(
        "PEGAWAI",
        "PEJABAT_KANTOR_ASAL",
        "PEJABAT_KANTOR_TUJUAN",
        "BENDAHARA",
        "PPK"
      ),
      allowNull: false,
    },
    koordinat_qr: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PROCESS", "SIGNED", "FAILED"),
      defaultValue: "PENDING",
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "tte_dokumen",
    modelName: "TteDokumen",
  }
);

export default TteDokumen;
