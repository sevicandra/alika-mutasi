import { RedisClientType, createClient } from "redis";
import logger from "@/utils/Logger.utils";
import { redisConfig } from "@/config/redis.config";
import { CacheError, TimeoutError } from "../utils/errors";

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: `redis://${redisConfig.host}:${redisConfig.port}`,
      username: redisConfig.username,
      password: redisConfig.password,
      database: redisConfig.db,
      socket: {
        rejectUnauthorized: !redisConfig.tls,
        connectTimeout: redisConfig.connectTimeout,
      },
    });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      this.isConnected = true;
      logger.info("Redis connected successfully");
    });

    this.client.on("error", (error) => {
      this.isConnected = false;
      logger.error("Redis error", { error: error.message });
    });

    this.client.on("reconnecting", () => {
      logger.warn("Redis reconnecting...");
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error("Failed to connect to Redis", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new CacheError("Failed to connect to Redis");
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error("Failed to disconnect from Redis", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        throw new CacheError("Redis connection not available");
      }

      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return await JSON.parse(value) as T;
    } catch (error) {
      if (error instanceof CacheError) throw error;

      logger.warn("Redis get operation failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't crash on cache error, just return null
      return null;
    }
  }

  async set(key: string, value: any, exSeconds?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new CacheError("Redis connection not available");
      }

      const serialized = await JSON.stringify(value);
      await this.client.set(key, serialized, {
        EX: exSeconds,
      });
    } catch (error) {
      logger.warn("Redis set operation failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't crash on cache error
      if (error instanceof CacheError) throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
    } catch (error) {
      logger.warn("Redis delete operation failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async setWithTimeout<T>(key: string, value: T, timeoutMs: number): Promise<T> {
    try {
      await this.set(key, value, Math.ceil(timeoutMs / 1000));
      return value;
    } catch (error) {
      logger.warn("Redis setWithTimeout operation failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new TimeoutError("Redis");
    }
  }

  async getWithFallback<T>(
    key: string,
    fallback: () => Promise<T>,
    cacheSeconds?: number
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached) return cached;
    } catch (error) {
      logger.warn("Cache retrieval failed, falling back", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const result = await fallback();

    try {
      await this.set(key, result, cacheSeconds || 3600);
    } catch (error) {
      logger.warn("Cache set failed after fallback", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
export const redisService = new RedisService();
