import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import methodOverride from "method-override";
import morgan from "morgan";
import cron from "node-cron";
import { approveMutasi } from "@/controllers/otomasi.controller";
import { correlationIdMiddleware } from "@/middlewares/correlation-id.middleware";
import { redisService } from "@/services/redis-service";
import { appConfig } from "@/config/app.config";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.middleware";
import "./register-alias";
import router from "./routes";
import { minioService } from "./services/minio-service";
import logger from "./utils/Logger.utils";

const startServer = async () => {
  try {
    await redisService.connect();
    await minioService.ensureBucketExists();
    dotenv.config();
    const port = appConfig.PORT;
    const app = express();

    app.use(correlationIdMiddleware);

    app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = Math.random().toString(36).substr(2, 9);
      res.setHeader("X-Request-ID", req.id);
      next();
    });
    app.use(
      morgan(":method :url :status :response-time ms", {
        stream: {
          write: (message) => {
            logger.http(message.trim());
          },
        },
      })
    );

    app.use(express.json());
    app.set("trust proxy", 1);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(methodOverride("_method"));

    app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "OK", timestamp: new Date() });
    });

    app.use("/", router);

    app.use(notFoundHandler);
    app.use(errorHandler);

    const server = app.listen(port, () => {
      logger.info(`Server started on port ${port}`);
    });

    cron.schedule("0 * * * *", () => {
      approveMutasi();
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        logger.info("HTTP server closed");
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

startServer();
