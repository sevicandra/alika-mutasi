import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import omit from "lodash/omit";
import { AuthenticatedRequest } from "@/types/auth";
import { errorResponse } from "@/helpers/respose.helper";
import { AlikaService } from "@/services/alika.service";

export function authenticate(requiredScopes?: string[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Unauthorized", null, 401);
      }
      const token = authHeader.split(" ")[1];
      
      if (!token) {
        return errorResponse(res, "Unauthorized", null, 401);
      }
      const decoded: any = jwt.verify(
        token,
        await AlikaService.getPublicKey(),
        {
          issuer: process.env.ALIKA_AUTH_ISSUER,
        }
      );      
      req.user = omit(decoded, [
        "scope",
        "account",
        "globalRoles",
        "exp",
        "iat",
        "jti",
        "sub",
        "iss",
        "aud",
      ]);
      req.roles = decoded.account || [];
      req.globalRoles = decoded.globalRoles || [];
      req.user = omit(decoded, [
        "scope",
        "account",
        "globalRoles",
        "exp",
        "iat",
        "jti",
        "sub",
        "iss",
        "aud",
      ]);
      req.roles = decoded.account || [];
      req.globalRoles = decoded.globalRoles || [];
      if (requiredScopes) {
        const tokenScopes = decoded.scope || [];
        const hasRequiredScopes = requiredScopes.every((scope) => {
          const [service, resource, action] = scope.split(".");
          return (
            tokenScopes.includes(`${service}.${resource}.${action}`) ||
            tokenScopes.includes(`${service}.${resource}.manage`) ||
            tokenScopes.includes(`${service}.${resource}.*`)
          );
        });
        if (!hasRequiredScopes) {
          return errorResponse(res, "Unauthorized", null, 401);
        }
      }
      next();
    } catch (e: any) {
      return errorResponse(res, "Internal Server Error", e, 500);
    }
  };
}
