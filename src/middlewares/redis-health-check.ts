import { NextFunction, Request, Response } from "express";
import { redisService } from "@/services/redis-service";
import logger from "@/utils/Logger.utils";

export const redisHealthCheck = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!redisService.isHealthy()) {
    logger.warn("Redis health check failed", { path: req.path });

    // Optional: You can either fail the request or just log the warning
    // For critical operations, you might want to fail
    // throw new CacheError('Redis unavailable');

    // For non-critical operations, just continue
    next();
    return;
  }

  next();
};
