import client from "@/config/redis.config"; // Mengimpor client yang sudah terkoneksi

export class RedisService {
  // Menyimpan data di Redis
  async setCache(key: string, value: string, ttl: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        client.set(key, value, {
          EX: ttl,
        });
        console.log(`Cache set for key: ${key}`);
        resolve();
      } catch (error: any) {
        reject(error.message);
      }
    });
  }
  // Mengambil data dari Redis
  async getCache(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const result = client.get(key);
        resolve(result);
      } catch (error: any) {
        console.error("Error getting cache in Redis:", error);
        reject(error.message);
      }
    });
  }

  // Menghapus data dari Redis
  async deleteCache(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        client.del(key);
        console.log(`Cache deleted for key: ${key}`);
        resolve();
      } catch (error) {
        console.error("Error deleting cache in Redis:", error);
        reject("Failed to delete cache in Redis");
      }
    });
  }
}
