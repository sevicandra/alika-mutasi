import "express-session";
import Sequelize from "sequelize";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: JWTPayload;
      token?: string;
      transaction?: Sequelize.Transaction;
      state?: string;
      scope?: string;
      access_token?: string;
      refresh_token?: string;
      client?: {
        id: string;
        client_id: string;
        grant_types: string[];
        redirect_uris: string[];
        scopes: string[];
      };
    }

    interface JWTPayload {
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
    }

    interface User {
      sub?: string;
      clientId?: string;
      scope?: string;
      name: string;
      nik: string;
      nip: string;
      kode_satker: string;
      satker: string;
      gravatar: string;
      account?: {
        service: string;
        kode_satker: string | null;
        roles: {
          kode: string;
          nama: string;
        }[];
      }[];
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport: {
      user: any;
    };
  }
}

export {};
