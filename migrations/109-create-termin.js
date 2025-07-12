"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "termin",
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
        },
        ref_termin: {
          type: Sequelize.STRING(2),
          references: {
            model: "ref_termin",
            key: "kode",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          allowNull: false,
        },
        pegawai_id: {
          type: Sequelize.UUID,
          references: {
            model: "pegawai_mutasi",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: false,
        },
        tahun: {
          type: Sequelize.STRING(4),
          allowNull: false,
        },
        nominal: {
          type: Sequelize.BIGINT({
            unsigned: true,
          }),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM(
            "DRAFT",
            "PENDING",
            "WAITING_APPROVAL",
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
          type: Sequelize.TEXT,
          allowNull: true,
        },
        submitted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        reviewed_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        uniqueKeys: {
          jenis_termin: {
            fields: ["pegawai_id", "ref_termin"],
          },
        },
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("termin");
  },
};
