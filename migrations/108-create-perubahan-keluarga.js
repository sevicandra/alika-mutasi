"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("perubahan_keluarga", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
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
      changed_field: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      revisi_id: {
        type: Sequelize.UUID,
        references: {
          model: "revisi_keluarga",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: true,
      },
      changed_by: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      changed_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("perubahan_keluarga");
  },
};
