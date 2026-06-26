import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { BaseError as SequelizeBaseError } from "sequelize";
import logger from "@/utils/Logger.utils";
import { BaseError } from "@/utils/errors/base-error";
import { handleSequelizeError } from "@/utils/errors/sequelize-error-handler";
import { UUID } from "@/utils/uuid.util";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    stack?: string;
  };
}

export const errorHandler: ErrorRequestHandler = (
  error: Error | BaseError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (
    req.headers["x-correlation-id"] ||
    req.headers["x-request-id"] ||
    UUID.v4()
  ).toString();
  const timestamp = new Date().toISOString();

  // Extract request info for logging
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.nip || "anonymous",
    userName: (req as any).user?.name || "anonymous",
    requestId,
  };

  // Convert Sequelize errors to BaseError
  let operationalError = error;
  if (!(error instanceof BaseError)) {
    const isSequelizeError =
      error instanceof SequelizeBaseError ||
      (error &&
        (error.name?.startsWith("Sequelize") ||
          error.constructor?.name?.startsWith("Sequelize") ||
          error.message?.includes("Sequelize") ||
          error.name === "ConnectionError" ||
          error.name === "ConnectionRefusedError"));

    if (isSequelizeError) {
      operationalError = handleSequelizeError(error);
    }
  }

  // Handle BaseError (operational errors)
  if (operationalError instanceof BaseError) {
    logger.warn("Operational Error", {
      ...requestInfo,
      errorCode: operationalError.errorCode,
      message: operationalError.message,
      statusCode: operationalError.statusCode,
      details: operationalError.details,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: operationalError.errorCode,
        message: operationalError.message,
        statusCode: operationalError.statusCode,
        details: operationalError.details,
        timestamp,
        requestId,
      },
    };

    if (process.env.NODE_ENV === "development") {
      response.error.stack = operationalError.stack;
    }

    res.status(operationalError.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  logger.error("Unhandled Error", {
    ...requestInfo,
    name: error.name,
    message: error.message,
    stack: error.stack,
  });

  // Don't expose internal error details to client
  const response: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
      statusCode: 500,
      timestamp,
      requestId,
    },
  };

  if (process.env.NODE_ENV === "development") {
    response.error.stack = error.stack;
  }

  res.status(500).json(response);
  next();
};

// 404 Not Found Middleware
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = (
    req.headers["x-correlation-id"] ||
    req.headers["x-request-id"] ||
    UUID.v4()
  ).toString();
  const error: ErrorResponse = {
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(404).json(error);
};
