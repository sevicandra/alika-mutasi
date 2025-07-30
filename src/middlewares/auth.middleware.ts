import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import omit from "lodash/omit";
import { AuthenticatedRequest } from "@/types/auth";
import { errorResponse } from "@/helpers/respose.helper";
import { AlikaService } from "@/services/alika.service";

export function authenticate(
  requiredScopes?: string[],
  requiredRoles?: string[]
) {
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
      const decoded = jwt.verify(token, await AlikaService.getPublicKey(), {
        issuer: process.env.ALIKA_AUTH_ISSUER,
      }) as {
        sub?: string;
        clientId?: string;
        scope: string;
        name: string;
        nik: string;
        nip: string;
        kode_satker: string;
        satker: string;
        gravatar: string;
        account: {
          service: string;
          kode_satker: string | null;
          roles: {
            kode: string;
            nama: string;
          }[];
        }[];
      };
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
      req.roles = decoded.account.find((a) => a.service === "mutasi")?.roles;
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

      if (requiredScopes) {
        const tokenScopes = decoded.scope;
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
      if (requiredRoles) {
        const hasRequiredRoles = requiredRoles.every((role) => {
          return req.roles?.some((r) => r.nama.toUpperCase() === role.toUpperCase());
        });
        if (!hasRequiredRoles) {
          return errorResponse(res, "Unauthorized", null, 401);
        }
      }
      next();
    } catch (e: any) {
      return errorResponse(res, "Internal Server Error", e, 500);
    }
  };
}
