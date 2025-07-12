"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tte_dokumen", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      dokumen_id: {
        type: Sequelize.UUID,
        references: {
          model: "dokumen_termin",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
      },
      nip: {
        type: Sequelize.STRING(18),
        allowNull: true,
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      jabatan: {
        type: Sequelize.ENUM(
          "PEGAWAI",
          "PEJABAT_KANTOR_ASAL",
          "PEJABAT_KANTOR_TUJUAN",
          "BENDAHARA",
          "PPK"
        ),
        allowNull: false,
        defaultValue: "PEGAWAI",
      },
      koordinat_qr: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "PROCESS", "SIGNED", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tte_dokumen");
  },
};
