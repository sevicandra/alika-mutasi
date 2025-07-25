"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rekening", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      pegawai_id: {
        type: Sequelize.UUID,
        references: {
          model: "pegawai_mutasi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        unique: true,
      },
      nomor_rekening: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      nama_rekening: {
        type: Sequelize.STRING(125),
        allowNull: false,
      },
      nama_bank: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("rekening");
  },
};
