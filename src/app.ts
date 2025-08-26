import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import router from "./routes";
import morgan from "morgan";
import logger from "./utils/Logger.utils";
import { appConfig } from "@/config/app.config";
import redisClient from "@/config/redis.config";
import "./register-alias";
import methodOverride from "method-override";
import { approveMutasi } from "@/controllers/otomasi.controller";
import cron from "node-cron";
import {
  ValidationError,
  DatabaseError,
  ConnectionError,
  UniqueConstraintError,
} from "sequelize";
import { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import multer from "multer";
import { errorResponse } from "@/helpers/respose.helper";

dotenv.config();
const port = appConfig.port;
const publicPath = path.join(__dirname, "../public");
const app = express();
redisClient.connect();
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
app.use(express.static(publicPath));
app.use(methodOverride("_method"));

app.use("/", router);
app.all("*splat", (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
    errors: null,
    meta: null,
    requestId: req.id,
  });
});
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    errorResponse(res, error.message, null, 500);
  } else if (
    error instanceof ValidationError ||
    error instanceof UniqueConstraintError
  ) {
    const parsedErrors = error.errors.map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return errorResponse(res, "Validation gagal", parsedErrors, 422);
  } else if (
    error instanceof DatabaseError ||
    error instanceof ConnectionError
  ) {
    const parsedErrors = error.message;
    logger.error(error.message, {
      stack: error.stack,
      id: req.id,
      method: req.method,
      url: req.url,
    });
    return errorResponse(res, "Kesalahan pada database", parsedErrors, 500);
  } else if (error instanceof AxiosError) {
    if (
      typeof error === "object" &&
      error !== null &&
      "isAxiosError" in error &&
      (error as AxiosError).isAxiosError
    ) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status || 500;
      const message =
        (axiosError.response?.data as { message?: string })?.message ||
        axiosError.message ||
        "Kesalahan pada permintaan eksternal";
      const details = axiosError.response?.data || null;
      logger.error(message, {
        stack: error.stack,
        id: req.id,
        method: req.method,
        url: req.url,
      });
      return errorResponse(res, message, details, statusCode);
    }
    logger.error(error.message, {
      stack: error.stack,
      id: req.id,
      method: req.method,
      url: req.url,
    });
    return errorResponse(res, "Terjadi kesalahan", null, 500);
  } else if (error instanceof Error) {
    const parsedErrors = { message: error.message };
    logger.error(error.message, {
      stack: error.stack,
      id: req.id,
      method: req.method,
      url: req.url,
    });
    return errorResponse(res, "Terjadi kesalahan", parsedErrors, 500);
  } else if (error instanceof jwt.TokenExpiredError) {
    return errorResponse(res, "Token expired", null, 401);
  } else if (error instanceof jwt.JsonWebTokenError) {
    return errorResponse(res, "Invalid token", null, 401);
  } else if (error instanceof jwt.NotBeforeError) {
    return errorResponse(res, "Token not active", null, 401);
  } else {
    next();
  }
});
const server = app.listen(port, () => {
  logger.info(`Server berjalan di port ${port}`, {
    port: port,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
  });
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
export default app;
