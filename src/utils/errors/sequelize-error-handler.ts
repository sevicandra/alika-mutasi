import {
  ConnectionError,
  ConnectionRefusedError,
  ForeignKeyConstraintError,
  DatabaseError as SequelizeDatabaseError,
  TimeoutError as SequelizeTimeoutError,
  ValidationError as SequelizeValidationError,
  UniqueConstraintError,
} from "sequelize";
import { BaseError } from "./base-error";
import {
  ConflictError,
  DatabaseError,
  TimeoutError,
  UnprocessableEntityError,
  ValidationError,
} from "./index";

export const handleSequelizeError = (error: any): BaseError => {
  // Validation Errors
  if (error instanceof SequelizeValidationError) {
    const details = error.errors.reduce(
      (acc, err) => {
        acc[err.path!] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );
    return new ValidationError("Database validation failed", details);
  }

  // Unique Constraint Error
  if (error instanceof UniqueConstraintError) {
    const field = error.fields?.[0] || "field";
    return new ConflictError(`${field} already exists`);
  }

  // Foreign Key Constraint Error
  if (error instanceof ForeignKeyConstraintError) {
    return new UnprocessableEntityError("Referenced record does not exist");
  }

  // Timeout Error
  if (error instanceof SequelizeTimeoutError) {
    return new TimeoutError("Database");
  }

  // Connection Errors
  if (error instanceof ConnectionError || error instanceof ConnectionRefusedError) {
    return new DatabaseError("Database connection failed", error);
  }

  // Generic Database Error
  if (error instanceof SequelizeDatabaseError) {
    return new DatabaseError("Database operation failed", error);
  }

  return new DatabaseError("Unknown database error", error);
};
