"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_hubungan_keluarga", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      kode: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      nama: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      jenis: {
        type: Sequelize.ENUM("PASANGAN", "ANAK", "LAINNYA"),
        allowNull: false,
        defaultValue: "LAINNYA",
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_hubungan_keluarga");
  },
};
