import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from "jsonwebtoken";
import { AuthenticationError, InternalServerError } from ".";
import { BaseError } from "./base-error";

export const handleJwtError = (error: unknown): BaseError => {
  if (error instanceof TokenExpiredError) {
    return new AuthenticationError("Token has expired");
  }
  if (error instanceof NotBeforeError) {
    return new AuthenticationError("Token is not valid yet");
  }
  if (error instanceof JsonWebTokenError) {
    return new AuthenticationError("Invalid token");
  }
  return new InternalServerError("Unexpected error occurred", { originalError: error });
};
