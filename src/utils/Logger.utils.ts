import winston from "winston";
import Transport from "winston-transport";
import { appConfig } from "@/config/app.config";
import { MinioService } from "@/services/minio.service";

const minioService = new MinioService();

class MinioTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.level = appConfig.LEVEL_LOG;
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const date = new Date();
    const fileName = `log/log-${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}.log`;
    const logEntry = `${JSON.stringify(info)}\n`;

    try {
      let existingContent = Buffer.from("");
      try {
        const stream = await minioService.downloadFile(fileName);
        if (stream) {
          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          await new Promise((resolve, reject) => {
            stream.on("end", () => {
              existingContent = Buffer.concat(chunks);
              resolve(null);
            });
            stream.on("error", reject);
          });
        }
      } catch (error: any) {
        if (error.message === "Object not found in MinIO") {
          // File doesn't exist, proceed to create a new one
        } else {
          throw error;
        }
      }

      const newContent = Buffer.concat([
        existingContent,
        Buffer.from(logEntry),
      ]);
      await minioService.uploadFile(newContent, fileName);
    } catch (error) {
      console.error("Error uploading log to MinIO:", error);
    }

    callback();
  }
}

const logger = winston.createLogger({
  level: appConfig.LEVEL_LOG,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new MinioTransport({ level: appConfig.LEVEL_LOG }),
  ],
});

export default logger;
