"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_kapal", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      rute: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kapal: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      kota_asal: {
        type: Sequelize.STRING(4),
        references: {
          model: "ref_kota",
          key: "kode",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false,
      },
      kota_tujuan: {
        type: Sequelize.STRING(4),
        references: {
          model: "ref_kota",
          key: "kode",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false,
      },
      tarif: {
        type: Sequelize.BIGINT({
          unsigned: true,
        }),
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_kapal");
  },
};
