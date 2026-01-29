import { QueueOptions } from "bull";
import dotenv from "dotenv";
import { appConfig } from "./app.config";
import { redisConfig } from "./redis.config";

dotenv.config();
export const queueOptions: QueueOptions = {
  redis: {
    host: redisConfig.host,
    port: redisConfig.port,
    username: redisConfig.username,
    password: redisConfig.password,
    db: redisConfig.db,
  },
  prefix: appConfig.NAME,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // Keep last 100 failed jobs for debugging
  },
  settings: {
    stalledInterval: 300000, // 5 minutes
    maxStalledCount: 1,
    guardInterval: 5000,
    retryProcessDelay: 500,
    drainDelay: 5,
  },
};
