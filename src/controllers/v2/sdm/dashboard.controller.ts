import { successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { SuratKeputusan } from "@/models";

export const getSk = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await SuratKeputusan.count({
      group: ["status"],
    });

    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};
