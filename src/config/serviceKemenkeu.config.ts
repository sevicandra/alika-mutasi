import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const ServiceKemenkeuConfig = {
  BASE_URI: process.env.SERVICE_KEMENKEU_BASE_URI || "",
  BASE_URI2: process.env.SERVICE_KEMENKEU_BASE_URI2 || "",
  TOKEN_URI: process.env.SERVICE_KEMENKEU_TOKEN_URI || "",
  CLIENT_ID: process.env.SERVICE_KEMENKEU_CLIENT_ID_FILE
    ? fs.readFileSync(process.env.SERVICE_KEMENKEU_CLIENT_ID_FILE, "utf8").trim()
    : process.env.SERVICE_KEMENKEU_CLIENT_ID || "",
  CLIENT_SECRET: process.env.SERVICE_KEMENKEU_CLIENT_SECRET_FILE
    ? fs.readFileSync(process.env.SERVICE_KEMENKEU_CLIENT_SECRET_FILE, "utf8").trim()
    : process.env.SERVICE_KEMENKEU_CLIENT_SECRET || "",
  GRANT_TYPE: process.env.SERVICE_KEMENKEU_GRANT_TYPE || "client_credentials",
  SCOPE: process.env.SERVICE_KEMENKEU_SCOPE || "",
};
