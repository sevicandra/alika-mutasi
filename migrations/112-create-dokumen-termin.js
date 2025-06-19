"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("dokumen_termin", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      termin_id: {
        type: Sequelize.UUID,
        references: {
          model: "termin",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
      },
      document_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ref_termin: {
        type: Sequelize.STRING(2),
        references: {
          model: "ref_termin",
          key: "kode",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      file: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("dokumen_termin");
  },
};
