// import { RefTermin } from "@/models";
// import { errorResponse, successResponse } from "@/helpers/respose.helper";
// import { AuthenticatedRequest } from "@/types/auth";
// import { Response, NextFunction } from "express";

// export const getAllRefTermin = async (
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
//     const order: any[] = [];
//     const sortField = (req.query.sortField as string) || "urutan";
//     const sortOrder = (req.query.sortOrder as string) || "ASC";
//     order.push([sortField, sortOrder.toUpperCase()]);
//     const data = await RefTermin.findAll({
//       limit,
//       offset,
//       order,
//     });
//     const count = await RefTermin.count();
//     return successResponse(res, "Berhasil mengambil referensi termin ", data, {
//       limit,
//       offset,
//       count,
//       totalPages: limit ? Math.ceil(count / limit) : 1,
//     });
//   } catch (error: unknown) {
//     next(error);
//   }
// };
