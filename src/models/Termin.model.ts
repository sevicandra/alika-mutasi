import { Association, BelongsTo, DataTypes, Model, Optional } from "sequelize";
import { UUID } from "@/utils/uuid.util";
import sequelize from "@/config/db.config";
import DokumenTermin from "./DokumenTermin.model";
import Payroll from "./Payroll.model";
import PegawaiMutasi from "./PegawaiMutasi.model";
import RefTermin from "./RefTermin.model";

type TerminAttributes = {
  id: string;
  ref_termin: string;
  pegawai_id: string;
  tahun: string;
  nominal: number;
  status:
    | "DRAFT"
    | "PENDING"
    | "WAITING_APPROVAL"
    | "WAITING_APPROVAL_SDM"
    | "APPROVED_SDM"
    | "WAITING_APPROVAL_KEU"
    | "APPROVED_KEU"
    | "PAID"
    | "REJECTED";
  admin_notes: string;
  submitted_at: Date | null;
  reviewed_at: Date | null;
  created_at: Date;
};

type TerminCreationAttributes = Optional<
  TerminAttributes,
  "id" | "created_at" | "submitted_at" | "reviewed_at" | "admin_notes" | "status"
>;
class Termin extends Model<TerminAttributes, TerminCreationAttributes> implements TerminAttributes {
  public id!: string;
  public ref_termin!: string;
  public pegawai_id!: string;
  public tahun!: string;
  public nominal!: number;
  public status!:
    | "DRAFT"
    | "PENDING"
    | "WAITING_APPROVAL"
    | "WAITING_APPROVAL_SDM"
    | "APPROVED_SDM"
    | "WAITING_APPROVAL_KEU"
    | "APPROVED_KEU"
    | "PAID"
    | "REJECTED";
  public admin_notes!: string;
  public submitted_at!: Date | null;
  public reviewed_at!: Date | null;
  public created_at!: Date;

  public Pegawai!: PegawaiMutasi;
  public Ref!: RefTermin;
  public DokumenTermin!: DokumenTermin[] | [];
  public Payroll!: Payroll | null;

  public static associations: {
    Pegawai: BelongsTo<Termin, PegawaiMutasi>;
    Ref: BelongsTo<Termin, RefTermin>;
    DokumenTermin: Association<Termin, DokumenTermin>;
    Payroll: Association<Termin, Payroll>;
  };
}

Termin.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => UUID.v7(),
      primaryKey: true,
    },
    ref_termin: {
      type: DataTypes.STRING(),
      allowNull: false,
      references: {
        model: "ref_termin",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    pegawai_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "pegawai_mutasi",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    tahun: {
      type: DataTypes.STRING(4),
      allowNull: false,
      validate: {
        is: { args: /^[0-9]{4}$/, msg: "Tahun must be 4 digits" },
      },
    },
    nominal: {
      type: DataTypes.BIGINT({
        unsigned: true,
      }),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PENDING",
        "WAITING_APPROVAL_SDM",
        "APPROVED_SDM",
        "WAITING_APPROVAL_KEU",
        "APPROVED_KEU",
        "PAID",
        "REJECTED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    admin_notes: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Termin",
    tableName: "termin",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["pegawai_id", "ref_termin_id"],
      },
    ],
  }
);

export default Termin;
