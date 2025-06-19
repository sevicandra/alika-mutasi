"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "timeline",
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
        },
        sk_id: {
          type: Sequelize.UUID,
          references: {
            model: "surat_keputusan",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: false,
        },
        ref_kode: {
          type: Sequelize.STRING(2),
          references: {
            model: "ref_timeline",
            key: "kode",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          allowNull: false,
        },
        tanggal: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
      },
      {
        uniqueKeys: {
          timeline: {
            fields: ["sk_id", "ref_kode"],
          },
        },
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("timeline");
  },
};
