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
      required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      file: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      uploadable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      process: {
        type: Sequelize.ENUM("IDLE", "PROCESSING"),
        allowNull: false,
        defaultValue: "IDLE",
      },
      processed_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("dokumen_termin");
  },
};
