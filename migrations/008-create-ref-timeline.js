"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_timeline", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      kode: {
        type: Sequelize.STRING(2),
        allowNull: false,
        unique: true,
      },
      nama: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_timeline");
  },
};
