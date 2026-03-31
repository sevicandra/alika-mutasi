import dotenv from "dotenv";
import fs from "fs";
import { Sequelize } from "sequelize";

dotenv.config();

const DB_LOGGING = process.env.DB_LOGGING || "false";

const DB_USERNAME = process.env.DB_USERNAME_FILE
  ? fs.readFileSync(process.env.DB_USERNAME_FILE, "utf8").trim()
  : process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD_FILE
  ? fs.readFileSync(process.env.DB_PASSWORD_FILE, "utf8").trim()
  : process.env.DB_PASSWORD;

const DB_CONNECTION = `${process.env.DB_CONNECTION}://${DB_USERNAME}:${DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
const sequelize = new Sequelize(DB_CONNECTION || "", {
  define: {
    timestamps: false,
  },
  logging: DB_LOGGING === "true" ? (msg) => console.log(msg) : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
