"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE VIEW monitoring_tagihan AS
      SELECT
        p.id AS pegawai_id,
        p.nama,
        COALESCE(rb.total_biaya, 0) AS total_tagihan,
        COALESCE(tp.total_termin, 0) AS total_termin,
        COALESCE(rb.total_biaya, 0) - COALESCE(tp.total_termin, 0) AS sisa_tagihan
      FROM
        pegawai_mutasi p
      LEFT JOIN (
        SELECT pegawai_id, SUM(harga_satuan * volume) AS total_biaya
        FROM rincian_biaya
        GROUP BY pegawai_id
      ) rb ON rb.pegawai_id = p.id
      LEFT JOIN (
        SELECT pegawai_id, SUM(nominal) AS total_termin
        FROM termin
        GROUP BY pegawai_id
      ) tp ON tp.pegawai_id = p.id;
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS monitoring_tagihan;
    `);
  },
};
