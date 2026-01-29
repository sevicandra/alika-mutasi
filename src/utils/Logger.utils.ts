import winston from "winston";
import Transport from "winston-transport";
import { minioService } from "@/services/minio-service";
import { appConfig } from "@/config/app.config";

interface LogQueueItem {
  info: any;
  callback: () => void;
}

class MinioTransport extends Transport {
  private logQueue: LogQueueItem[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.level = appConfig.LEVEL_LOG;
    
    // Start batch processor
    this.startBatchProcessor();
  }

  private startBatchProcessor() {
    setInterval(() => {
      if (this.logQueue.length > 0) {
        this.processBatch();
      }
    }, this.FLUSH_INTERVAL);
  }

  async log(info: any, callback: () => void) {
    // Emit logged event immediately (Winston behavior)
    setImmediate(() => {
      this.emit("logged", info);
    });

    // Queue the log for batch processing
    this.logQueue.push({ info, callback });

    // Process batch if queue size reaches threshold
    if (this.logQueue.length >= this.BATCH_SIZE) {
      this.processBatch();
    }
  }

  private async processBatch() {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.logQueue.splice(0, this.BATCH_SIZE);

    try {
      const date = new Date();
      const fileName = `log/log-${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}.log`;
      
      // Build batch content
      const batchContent = batch
        .map((item) => JSON.stringify(item.info))
        .join("\n") + "\n";

      // Get existing content
      let existingContent = Buffer.from("");
      try {
        const fileBuffer = await minioService.getFile(fileName);
        if (fileBuffer && fileBuffer.length > 0) {
          existingContent = Buffer.from(fileBuffer);
        }
      } catch (error) {
        // File doesn't exist - that's ok, we'll create it
        if (!this.isFileNotFoundError(error)) {
          throw error;
        }
      }

      // Combine and upload
      const newContent = Buffer.concat([
        existingContent,
        Buffer.from(batchContent),
      ]);

      await minioService.uploadFile(newContent, fileName, "text/plain");

      // Execute callbacks for successful logs
      batch.forEach((item) => {
        try {
          item.callback();
        } catch (error) {
          console.error("Error executing log callback:", error);
        }
      });
    } catch (error) {
      console.error("Error processing batch logs to MinIO:", error);
      
      // Still execute callbacks to prevent hanging
      batch.forEach((item) => {
        try {
          item.callback();
        } catch (cbError) {
          console.error("Error executing callback after batch error:", cbError);
        }
      });
    } finally {
      this.isProcessing = false;
      
      // Process remaining queue if exists
      if (this.logQueue.length > 0) {
        this.processBatch();
      }
    }
  }

  private isFileNotFoundError(error: any): boolean {
    // Check multiple ways error could indicate file not found
    if (error?.message?.includes("The specified key does not exist")) {
      return true;
    }
    if (error?.code === "NoSuchKey") {
      return true;
    }
    if (error?.status === 404) {
      return true;
    }
    return false;
  }

  // Graceful shutdown
  async close(): Promise<void> {
    // Flush remaining logs
    if (this.logQueue.length > 0) {
      await this.processBatch();
    }
    return ;
  }
}

const logger = winston.createLogger({
  level: appConfig.LEVEL_LOG,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`
        )
      ),
    }),
    new winston.transports.File({ 
      filename: "error.log", 
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({ 
      filename: "combined.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new MinioTransport({ level: appConfig.LEVEL_LOG }),
  ],
});

// Graceful shutdown
process.on("exit", async () => {
  logger.transports.forEach((transport) => {
    if (transport instanceof MinioTransport) {
      transport.close();
    }
  });
});

export default logger;
