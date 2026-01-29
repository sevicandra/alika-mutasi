export class BaseError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_SERVER_ERROR",
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, BaseError.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
