import dotenv from "dotenv";
dotenv.config();
export const appConfig = {
  name: process.env.APP_NAME || "alika",
  env: process.env.NODE_ENV || "development",
  url: process.env.APP_URL || "http://localhost:3000",
  port: process.env.APP_PORT || 3000,
  version: process.env.APP_VERSION || "1.0.0",
  timezone: process.env.APP_TIMEZONE || "Asia/Jakarta",
  locale: process.env.APP_LOCALE || "id",
  LEVEL_LOG: process.env.APP_LEVEL_LOG || "info",
};
