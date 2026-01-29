// import { RefProvinsi, RefKota } from "@/models";
// import { errorResponse, successResponse } from "@/helpers/respose.helper";
// import { AuthenticatedRequest } from "@/types/auth";
// import { Response, NextFunction } from "express";
// import { Op } from "sequelize";

// export const getAllProvinsi = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { nip } = req.user;
//     if (!nip) {
//       return errorResponse(res, "Pengguna tidak dapat di verifikasi", null, 403);
//     }
//     const limit = parseInt(req.query.limit as string) || undefined;
//     const offset = parseInt(req.query.offset as string) || undefined;
//     const search = (req.query.search as string) || undefined;
//     const where: any = {};
//     if (search) where.kantor = { [Op.like]: `%${search}%` };
//     const order: any[] = [];
//     const sortField = (req.query.sortField as string) || "id";
//     const sortOrder = (req.query.sortOrder as string) || "DESC";
//     order.push([sortField, sortOrder.toUpperCase()]);
//     const { rows: data, count } = await RefProvinsi.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order,
//       attributes: ["kode", "provinsi"],
//     });
//     return successResponse(res, "Berhasil mengambil data kantor", data, {
//       limit,
//       offset,
//       count,
//       totalPages: limit ? Math.ceil(count / limit) : 1,
//     });
//   } catch (error: unknown) {
//     next(error);
//   }
// };

// export const getKota = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   const { KodeProvinsi } = req.params;
//   try {
//     const limit = parseInt(req.query.limit as string) || undefined;
//     const offset = parseInt(req.query.offset as string) || undefined;
//     const search = (req.query.search as string) || undefined;
//     const where: any = {
//       kode_provinsi: KodeProvinsi,
//     };
//     if (search) where.kantor = { [Op.like]: `%${search}%` };
//     const order: any[] = [];
//     const sortField = (req.query.sortField as string) || "id";
//     const sortOrder = (req.query.sortOrder as string) || "DESC";
//     order.push([sortField, sortOrder.toUpperCase()]);
//     const { rows: data, count } = await RefKota.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order,
//       attributes: ["kode", "kode_provinsi", "kota"],
//     });
//     return successResponse(res, "Berhasil mengambil data kantor", data, {
//       limit,
//       offset,
//       count,
//       totalPages: limit ? Math.ceil(count / limit) : 1,
//     });
//   } catch (error: unknown) {
//     next(error);
//   }
// };
