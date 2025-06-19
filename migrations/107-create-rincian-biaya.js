"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rincian_biaya", {
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
      volume: {
        type: Sequelize.DOUBLE(5, 2),
        allowNull: false,
      },
      harga_satuan: {
        type: Sequelize.BIGINT({
          unsigned: true,
        }),
        allowNull: false,
      },
      jenis: {
        type: Sequelize.ENUM(
          "BIAYA_ANGKUT_ORANG",
          "BIAYA_ANGKUT_BARANG",
          "UANG_HARIAN",
          "BIAYA_ANGKUT_ORANG_ART",
          "BIAYA_ANGKUT_BARANG_ART",
          "UANG_HARIAN_ART"
        ),
        allowNull: false,
      },
      sub_jenis: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      keterangan: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("rincian_biaya");
  },
};
