"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("keluarga", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      hris_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
      nik: {
        type: Sequelize.STRING(16),
        allowNull: true,
      },
      nama: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      hubungan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ref_hubungan_keluarga",
          key: "kode",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      tanggal_lahir: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      is_invant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pekerjaan: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("TERTANGGUNG", "TIDAK_TERTANGGUNG"),
        allowNull: false,
        defaultValue: "TIDAK_TERTANGGUNG",
      },
      file: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("keluarga");
  },
};
