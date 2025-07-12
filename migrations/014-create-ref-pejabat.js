"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_pejabat", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jenis: {
        type: Sequelize.ENUM("PPK", "BENDAHARA"),
        allowNull: false,
        unique: true,
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nip: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_pejabat");
  },
};
