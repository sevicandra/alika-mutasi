import { BaseError } from "./base-error";

export class InternalServerError extends BaseError {
  constructor(message: string = "Internal Server Error", details?: Record<string, any>) {
    super(message, 500, "INTERNAL_SERVER_ERROR", true, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 422, "VALIDATION_ERROR", true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = "Authentication failed", details?: Record<string, any>) {
    super(message, 401, "AUTHENTICATION_ERROR", true, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "AUTHORIZATION_ERROR", true);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "RESOURCE_NOT_FOUND", true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR", true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnprocessableEntityError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 422, "UNPROCESSABLE_ENTITY", true, details);
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(serviceName: string, message: string, statusCode: number = 502) {
    super(`${serviceName} error: ${message}`, statusCode, "EXTERNAL_SERVICE_ERROR", true);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class InvalidRequestError extends BaseError {
  constructor(message: string) {
    super(message, 400, "INVALID_REQUEST", true);
    Object.setPrototypeOf(this, InvalidRequestError.prototype);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      500,
      "DATABASE_ERROR",
      true,
      process.env.NODE_ENV === "development" ? { original: originalError?.message } : {}
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class CacheError extends BaseError {
  constructor(message: string) {
    super(message, 503, "CACHE_ERROR", true);
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

export class FileUploadError extends BaseError {
  constructor(message: string) {
    super(message, 400, "FILE_UPLOAD_ERROR", true);
    Object.setPrototypeOf(this, FileUploadError.prototype);
  }
}

export class StorageError extends BaseError {
  constructor(message: string) {
    super(message, 503, "STORAGE_ERROR", true);
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

export class TimeoutError extends BaseError {
  constructor(service: string = "Service") {
    super(`${service} request timeout`, 504, "REQUEST_TIMEOUT", true);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class QueueError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 503, "QUEUE_ERROR", true, details);
    Object.setPrototypeOf(this, QueueError.prototype);
  }
}
