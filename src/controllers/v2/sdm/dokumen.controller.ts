import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { fileResponse } from "@/helpers/respose.helper";
import { DokumenTermin } from "@/repositories";

export const DokumenTerminControllerV2 = {
  getFile: asyncHandler(async (req: Request, res: Response) => {
    const { permohonanId, dokumenId } = req.params;
    if (typeof permohonanId != "string" || typeof dokumenId != "string") {
      throw new InvalidRequestError("Invalid permohonan id or dokumen id");
    }
    const data = await DokumenTermin.findOne({
      where: { termin_id: permohonanId, id: dokumenId },
    });
    if (!data || !data.file) {
      throw new NotFoundError("Data tidak ditemukan");
    }
    const stream = await minioService.getFile(`${data.file}`);
    fileResponse(res, stream, `${data.document_type}.pdf`, "application/pdf");
  }),
};
