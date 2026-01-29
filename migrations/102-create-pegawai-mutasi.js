"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "pegawai_mutasi",
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
        },
        sk_id: {
          type: Sequelize.UUID,
          references: {
            model: "surat_keputusan",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: false,
        },
        kantor_asal: {
          type: Sequelize.STRING(6),
          references: {
            model: "ref_kantor",
            key: "kode_satker",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          allowNull: false,
        },
        kantor_tujuan: {
          type: Sequelize.STRING(6),
          references: {
            model: "ref_kantor",
            key: "kode_satker",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          allowNull: false,
        },
        golongan: {
          type: Sequelize.STRING(2),
          references: {
            model: "ref_golongan",
            key: "kode",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          allowNull: false,
        },
        nip: {
          type: Sequelize.STRING(18),
          allowNull: false,
          validate: {
            is: /^[0-9]{18}$/,
          },
        },
        nama: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        jumlah_hari: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM(
            "DRAFT",
            "PENDING_APROVAL",
            "CALCULATING",
            "APPROVED",
            "DISPUTED",
            "REVISED"
          ),
          defaultValue: "DRAFT",
          allowNull: false,
        },
        process_keluarga: {
          type: Sequelize.ENUM("IDLE", "PROCESSING", "DONE", "FAILED", "RETRYING"),
          defaultValue: "IDLE",
          allowNull: false,
        },
        process_biaya: {
          type: Sequelize.ENUM("IDLE", "PROCESSING", "DONE", "FAILED", "RETRYING"),
          defaultValue: "IDLE",
          allowNull: false,
        },
        process_termin: {
          type: Sequelize.ENUM("IDLE", "PROCESSING", "DONE", "FAILED", "RETRYING"),
          defaultValue: "IDLE",
          allowNull: false,
        },
        faktor_darat: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        faktor_laut: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        faktor_udara: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 5,
        },
        kelas_pesawat: {
          type: Sequelize.ENUM("EKONOMI", "BISNIS"),
          allowNull: false,
          defaultValue: "EKONOMI",
        },
        nomor_spd: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        tanggal_spd: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
      },
      {
        uniqueKeys: {
          nip: {
            fields: ["nip", "sk_id"],
          },
        },
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pegawai_mutasi");
  },
};
