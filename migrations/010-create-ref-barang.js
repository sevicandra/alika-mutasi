"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_barang", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      golongan: {
        type: Sequelize.STRING(1),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "TIDAK_BERKELUARGA",
          "BERKELUARGA_TANPA_ANAK",
          "BERKELUARGA_DENGAN_ANAK"
        ),
        allowNull: false,
      },
      volume: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_barang");
  },
};