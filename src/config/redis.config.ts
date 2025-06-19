import { createClient } from "redis";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD_FILE
    ? fs.readFileSync(process.env.REDIS_PASSWORD_FILE, "utf8").trim()
    : process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
  // jika menggunakan Redis dengan TLS/SSL
  tls: process.env.REDIS_TLS === "true" ? true : false,
  connectTimeout: process.env.REDIS_CONNECT_TIMEOUT
    ? parseInt(process.env.REDIS_CONNECT_TIMEOUT)
    : 30000, // waktu tunggu koneksi dalam milidetik
};
const client = createClient({
  url: `redis://${redisConfig.host}:${redisConfig.port}`,
  password: redisConfig.password,
  database: redisConfig.db,
  socket: {
    tls: redisConfig.tls,
    connectTimeout: redisConfig.connectTimeout,
  },
});

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default client;
