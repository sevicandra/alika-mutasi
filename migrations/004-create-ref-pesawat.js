"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ref_pesawat", {
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
      kota_asal: {
        type: Sequelize.STRING(5),
        references: {
          model: "ref_kota",
          key: "kode",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false,
      },
      kota_tujuan: {
        type: Sequelize.STRING(5),
        references: {
          model: "ref_kota",
          key: "kode",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false,
      },
      ekonomi: {
        type: Sequelize.BIGINT({
          unsigned: true,
        }),
        allowNull: false,
      },
      bisnis: {
        type: Sequelize.BIGINT({
          unsigned: true,
        }),
        allowNull: false,
      },
      jenis_tarif: {
        type: Sequelize.ENUM("SBM", "NON_SBM"),
        allowNull: false,
        defaultValue: "SBM",
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ref_pesawat");
  },
};
