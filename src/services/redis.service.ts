import { redisConfig } from "@/config/redis.config";
import { createClient, RedisClientType } from "redis";

export class RedisService {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    this.client = createClient({
      url: redisConfig.url,
      password: redisConfig.password,
      socket: {
        connectTimeout: 60000,
      },
    });

    this.client.on("error", (error) => {
      console.error("Redis connection error:", error);
      this.connected = false;
    });

    this.client.on("connect", () => {
      console.log("Redis connected");
      this.connected = true;
    });
  }

  async ensureConnection(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async setCache(key: string, value: string, ttl: number): Promise<void> {
    await this.ensureConnection();
    await this.client.setEx(key, ttl, value);
  }

  async getCache(key: string): Promise<string | null> {
    await this.ensureConnection();
    return await this.client.get(key);
  }

  async deleteCache(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }
}
