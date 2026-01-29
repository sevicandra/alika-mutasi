"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "ref_termin",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
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
        required_doc: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        urutan: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
        },
      },
      {
        indexes: [
          {
            unique: true,
            fields: ["kode"],
          },
        ],
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_termin");
  },
};
