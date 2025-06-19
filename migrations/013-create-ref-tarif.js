"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_tarif", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jenis: {
        type: Sequelize.ENUM(
          "TRANSPORT_DARAT_ORANG",
          "TRANSPORT_DARAT_BARANG",
          "PACKING_DARAT",
          "PACKING_LAUT",
          "PACKING_UDARA",
          "UANG_HARIAN"
        ),
        allowNull: false,
      },
      tarif: {
        type: Sequelize.BIGINT({
          unsigned: true,
        }),
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
    await queryInterface.dropTable("ref_tarif");
  },
};
