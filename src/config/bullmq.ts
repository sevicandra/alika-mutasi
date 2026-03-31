import { ConnectionOptions } from "bullmq";
import dotenv from "dotenv";
import { redisConfig } from "./redis.config";

dotenv.config();

export const bullmqConfig: ConnectionOptions = {
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username,
  password: redisConfig.password,
  db: redisConfig.db,
  connectTimeout: 30000,
};
