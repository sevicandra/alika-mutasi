// import { RefKantor } from "@/models";
// import { errorResponse, successResponse } from "@/helpers/respose.helper";
// import { AuthenticatedRequest } from "@/types/auth";
// import { Response, NextFunction } from "express";
// import { Op } from "sequelize";

// export const getAllKantor = async (
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
//     const kantor = await RefKantor.findAll({
//       where,
//       limit,
//       offset,
//       order,
//     });
//     const count = await RefKantor.count({ where });
//     return successResponse(res, "Berhasil mengambil data kantor", kantor, {
//       limit,
//       offset,
//       count,
//       totalPages: limit ? Math.ceil(count / limit) : 1,
//     });
//   } catch (error: unknown) {
//     next(error);
//   }
// };

// export const getKantorById = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const kantor = await RefKantor.findByPk(id);
//     if (!kantor) {
//       return errorResponse(res, "data tidak ditemukan", null, 404);
//     }
//     return successResponse(res, "Berhasil mengambil data kantor", kantor);
//   } catch (error: unknown) {
//     next(error);
//   }
// };

// export const getKantorByKodeSatker = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { kodeSatker } = req.params;
//     const kantor = await RefKantor.findOne({
//       where: { kode_satker: kodeSatker },
//     });
//     if (!kantor) {
//       return errorResponse(res, "data tidak ditemukan", null, 404);
//     }
//   } catch (error: unknown) {
//     next(error);
//   }
// };

// export const createKantor = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//   } catch (error: unknown) {
//     next(error);
//   }
// };

// export const updateKantor = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { kode_kota, kode_satker, kantor } = req.body;
//     const data = await RefKantor.findByPk(id);
//     if (!data) {
//       return errorResponse(res, "data tidak ditemukan", null, 404);
//     }

//     if (kode_kota) data.kode_kota = kode_kota;
//     if (kode_satker) data.kode_satker = kode_satker;
//     if (kantor) data.kantor = kantor;

//     await data.save();

//     return successResponse(res, "Berhasil memperbarui data kantor", data);
//   } catch (error: unknown) {
//     next(error);
//   }
// };

// export const deleteKantor = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const data = await RefKantor.findByPk(id);
//     if (!data) {
//       return errorResponse(res, "data tidak ditemukan", null, 404);
//     }
//     await data.destroy();

//     return successResponse(res, "Berhasil menghapus data kantor", { id });
//   } catch (error: unknown) {
//     next(error);
//   }
// };
