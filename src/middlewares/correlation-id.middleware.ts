import { NextFunction, Request, Response } from "express";
import { UUID } from "@/utils/uuid.util";

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if request already has correlation ID (from API Gateway)
  const correlationId = req.headers["x-correlation-id"] || req.headers["x-request-id"] || UUID.v4();

  // Attach to request
  req.id = correlationId.toString();

  // Send in response headers for client tracking
  res.setHeader("X-Correlation-ID", req.id);
  res.setHeader("X-Request-ID", req.id);

  next();
};
