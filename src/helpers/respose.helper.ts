import { Response } from "express";

const successResponse = (
  res: Response,
  message = "OK",
  data: any = null,
  meta: any = null,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
    meta,
  });
};

const errorResponse = (
  res: Response,
  message = "Terjadi kesalahan",
  errors: any = null,
  statusCode = 400
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
    meta: null,
  });
};

const fileResponse = (
  res: Response,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string = "application/octet-stream",
  statusCode = 200
) => {
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", contentType);
  return res.status(statusCode).send(fileBuffer);
};

export { successResponse, errorResponse, fileResponse };
