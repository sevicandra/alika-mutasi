import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

export const redisConfig = {
  url: `redis://${process.env.REDIS_HOST || "localhost"}:${
    process.env.REDIS_PORT || 6379
  }`,
  username: process.env.REDIS_USERNAME_FILE
    ? fs.readFileSync(process.env.REDIS_USERNAME_FILE, "utf8").trim()
    : process.env.REDIS_USERNAME || "",
  password: process.env.REDIS_PASSWORD_FILE
    ? fs.readFileSync(process.env.REDIS_PASSWORD_FILE, "utf8").trim()
    : process.env.REDIS_PASSWORD || "",
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
};

