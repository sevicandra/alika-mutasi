import { Request } from "express";
export interface AuthenticatedRequest extends Request {
  id?: string;
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
      kode: string;
      nama: string;
  }[];
}
