"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pembayaran_log", {
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
      },
      actor_nip: {
        type: Sequelize.STRING(18),
        allowNull: true,
      },
      actor_role: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING(225),
        allowNull: false,
      },
      action_type: {
        type: Sequelize.ENUM(
          "GENERAL_ACTION",
          "SANGGAHAN_DIAJUKAN",
          "SANGGAHAN_DIREVIEW",
        ),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pembayaran_log");
  },
};
