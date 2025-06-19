import { Response } from "express";
const successResponse = (res: Response, message = 'OK', data: any = null, meta: any = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      errors: null,
      meta
    });
  };
  
  const errorResponse = (res: Response, message = 'Terjadi kesalahan', errors: any = null, statusCode = 400) => {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      errors,
      meta: null
    });
  };
  
  export {
    successResponse,
    errorResponse
  };
  