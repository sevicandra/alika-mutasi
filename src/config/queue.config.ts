import { redisConfig } from "./redis.config";
import { appConfig } from "./app.config";
import { QueueOptions } from "bull";
import dotenv from "dotenv";
dotenv.config();
export const queueOptions: QueueOptions = {
  redis: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
  },
  prefix: appConfig.name,
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
    stalledInterval: 1000 * 60 * 1,
    maxStalledCount: 1,
    guardInterval: 5000,
    retryProcessDelay: 500,
    drainDelay: 1000 * 60,
  },
};
