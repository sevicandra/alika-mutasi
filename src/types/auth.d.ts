import { Request } from "express";
export interface AuthenticatedRequest extends Request {
  user?:
    | {
        name: string;
        nik: string;
        nip: string;
        kode_satker: string;
        satker: string;
        gravatar: string;
      }
    | any;
  roles?: {
    kode_satker: string;
    roles: {
      kode: string;
      nama: string;
    }[];
  }[];
  globalRoles?: {
    kode: string;
    nama: string;
  }[];
}
