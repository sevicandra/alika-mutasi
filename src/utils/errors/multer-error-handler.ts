import { MulterError } from "multer";
import { InternalServerError, InvalidRequestError } from ".";
import { BaseError } from "./base-error";

export const handleMulterError = (error: unknown): BaseError => {
  if (error instanceof MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return new InvalidRequestError("File size is too large");
      case "LIMIT_FILE_COUNT":
        return new InvalidRequestError("File limit reached");
      case "LIMIT_UNEXPECTED_FILE":
        return new InvalidRequestError("Unexpected file field");
      default:
        return new InvalidRequestError("Multer error occurred");
    }
  } else {
    return new InternalServerError("Unexpected error occurred on Multer", { originalError: error });
  }
};
