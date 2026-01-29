import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AlikaService } from "@/services/alika.service";
import { AuthenticationError, AuthorizationError } from "@/utils/errors";
import { handleJwtError } from "@/utils/errors/jwt-error-handler";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError("Missing authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new AuthenticationError("Invalid authorization header format");
  }
  const token = parts[1];
  req.token = token;
  try {
    const payload = (await jwt.verify(token, await AlikaService.getPublicKey(), {
      issuer: process.env.ALIKA_AUTH_ISSUER,
    })) as Express.JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    throw handleJwtError(error);
  }
};

export const authorizeScopes = (requiredScopes?: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }
      if (requiredScopes) {
        const tokenScopes = req.user.scope;
        const hasRequiredScopes = requiredScopes.every((scope) => {
          const [service, resource, action] = scope.toLowerCase().split(".");
          return (
            tokenScopes?.includes(`${service}.${resource}.${action}`) ||
            tokenScopes?.includes(`${service}.${resource}.manage`) ||
            tokenScopes?.includes(`${service}.${resource}.*`)
          );
        });
        if (!hasRequiredScopes) {
          throw new AuthorizationError(
            `Access requires one of scopes: ${requiredScopes.join(", ")}`
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const authorizeRoles = (requiredRoles?: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError("User not authenticated");
      }
      if (requiredRoles) {
        const hasRequiredRoles = requiredRoles.every((r) => {
          const [service, role] = r.split(".");
          const userRole = req.user?.account?.find(
            (a) => a.service.toLowerCase() === service
          )?.roles;
          return userRole?.some((r) => r.nama.toUpperCase() === role.toUpperCase());
        });
        if (!hasRequiredRoles) {
          throw new AuthorizationError(`Access requires one of roles: ${requiredRoles.join(", ")}`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
