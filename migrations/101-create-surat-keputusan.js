"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("surat_keputusan", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      nomor: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      uraian: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tmt: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      jenjang: {
        type: Sequelize.ENUM(
          "ESELON I",
          "ESELON II",
          "ESELON III",
          "ESELON IV",
          "JABATAN FUNGSIONAL",
          "PELAKSANA",
          "PENSIUNAN"
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "PUBLISH", "SELESAI"),
        defaultValue: "DRAFT",
        allowNull: false,
      },
      file: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("surat_keputusan");
  },
};
