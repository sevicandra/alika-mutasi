import { Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { minioService } from "@/services/minio-service";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { fileResponse } from "@/helpers/respose.helper";
import { DokumenTermin } from "@/repositories";
import { AuthenticatedRequest } from "@/types/auth";

export const downlaodFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (typeof id != "string") {
    throw new InvalidRequestError("Invalid request");
  }

  const data = await DokumenTermin.findById(id);
  if (!data) {
    throw new NotFoundError("File not found");
  }
  const stream = await minioService.getFile(`${data.file}`);
  fileResponse(res, stream, `${data.document_type}.pdf`, "application/pdf");
});
