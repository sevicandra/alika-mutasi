import { Client } from "minio";
import logger from "@/utils/Logger.utils";
import { minioConfig } from "@/config/minio.config";
import { FileUploadError, StorageError, ValidationError } from "../utils/errors";

export class MinIOService {
  private client: Client;
  private bucketName: string;
  private validateObjectName(objectName: string): void {
    if (!objectName || objectName.includes("..") || objectName.includes("//")) {
      throw new ValidationError("Invalid object name");
    }
  }
  private isAllowedContentType(contentType: string): boolean {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/gif", "text/plain"];
    return allowed.includes(contentType);
  }

  constructor() {
    this.client = new Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });

    this.bucketName = minioConfig.bucket;
  }

  async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, "us-east-1");
        logger.info(`MinIO bucket created: ${this.bucketName}`);
      }
    } catch (error) {
      logger.error("Failed to ensure MinIO bucket exists", {
        error: error instanceof Error ? error.message : String(error),
        bucket: this.bucketName,
      });
      throw new StorageError("Failed to initialize storage");
    }
  }

  async uploadFile(
    file: Buffer<ArrayBuffer> | Buffer<ArrayBufferLike>,
    objectName: string,
    contentType: string,
    maxSizeBytes: number = 100 * 1024 * 1024
  ): Promise<string> {
    try {
      this.validateObjectName(objectName);
      if (file.byteLength > maxSizeBytes) {
        throw new FileUploadError(
          `File size ${file.byteLength} exceeds limit of ${maxSizeBytes} bytes`
        );
      }
      if (!this.isAllowedContentType(contentType)) {
        throw new FileUploadError(`Content type ${contentType} not allowed`);
      }

      await this.client.putObject(this.bucketName, objectName, file, file.byteLength, {
        "Content-Type": contentType,
      });
      return this.getObjectUrl(objectName);
    } catch (error) {
      if (error instanceof ValidationError) throw error;

      logger.error("MinIO upload failed", {
        objectName,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new StorageError(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async downloadFile(objectName: string, downloadPath: string): Promise<void> {
    try {
      await this.client.fGetObject(this.bucketName, objectName, downloadPath);
    } catch (error) {
      logger.error("MinIO download failed", {
        objectName,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new StorageError(
        `Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async getFile(objectName: string): Promise<Buffer> {
    try {
      const fileStream = await this.client.getObject(this.bucketName, objectName);
      const chunks: Buffer[] = [];

      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }

      const fileBuffer = Buffer.concat(chunks);
      return fileBuffer;
    } catch (error) {
      logger.error("MinIO get file failed", {
        objectName,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new StorageError(
        `Failed to get file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, objectName);

      logger.info("File deleted from MinIO", {
        objectName,
        bucket: this.bucketName,
      });
    } catch (error) {
      logger.error("MinIO delete failed", {
        objectName,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new StorageError(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async listFiles(prefix: string = ""): Promise<string[]> {
    try {
      const files: string[] = [];

      return new Promise((resolve, reject) => {
        const stream = this.client.listObjects(this.bucketName, prefix, true);

        stream.on("data", (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });

        stream.on("error", (error) => {
          logger.error("MinIO list operation failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          reject(
            new StorageError(
              `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`
            )
          );
        });

        stream.on("end", () => {
          resolve(files);
        });
      });
    } catch (error) {
      console.log(error);

      throw new StorageError("Failed to list files from storage");
    }
  }

  getObjectUrl(objectName: string): string {
    const endpoint = process.env.MINIO_ENDPOINT || "localhost";
    const port = process.env.MINIO_PORT || "9000";
    const useSSL = process.env.MINIO_USE_SSL === "true";
    const protocol = useSSL ? "https" : "http";

    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${objectName}`;
  }

  async getFileSize(objectName: string): Promise<number> {
    try {
      const stat = await this.client.statObject(this.bucketName, objectName);
      return stat.size;
    } catch (error) {
      logger.error("Failed to get file size", {
        objectName,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new StorageError("Failed to get file size");
    }
  }
}

export const minioService = new MinIOService();
