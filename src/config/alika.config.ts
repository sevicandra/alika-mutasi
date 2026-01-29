import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const alikaConfig = {
  BASE_URI: process.env.ALIKA_AUTH_BASE_URI_INTERNAL || process.env.ALIKA_AUTH_BASE_URI || "",
  CLIENT_ID: process.env.ALIKA_AUTH_CLIENT_ID_FILE
    ? fs.readFileSync(process.env.ALIKA_AUTH_CLIENT_ID_FILE, "utf8").trim()
    : (process.env.ALIKA_AUTH_CLIENT_ID as string),
  CLIENT_SECRET: process.env.ALIKA_AUTH_CLIENT_SECRET_FILE
    ? fs.readFileSync(process.env.ALIKA_AUTH_CLIENT_SECRET_FILE, "utf8").trim()
    : (process.env.ALIKA_AUTH_CLIENT_SECRET as string),
  GRANT_TYPE: process.env.ALIKA_AUTH_GRANT_TYPE || "client_credentials",
  SCOPE: process.env.ALIKA_AUTH_SCOPE || "",
  PUSH_NOTIFICATION_URL:
    process.env.ALIKA_PUSH_NOTIFICATION_URL_INTERNAL ||
    process.env.ALIKA_PUSH_NOTIFICATION_URL ||
    "",
  ISSUER: process.env.ALIKA_AUTH_ISSUER,
};
