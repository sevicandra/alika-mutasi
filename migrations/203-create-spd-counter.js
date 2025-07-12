"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("spd_counter", {
      year: {
        type: Sequelize.STRING(4),
        primaryKey: true,
      },
      ext:{
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      last_number: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("spd_counter");
  },
};
