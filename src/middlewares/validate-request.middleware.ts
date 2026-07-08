import { parse } from "csv-parse";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../utils/errors";

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.reduce(
          (acc, err) => {
            acc[err.path.join(".")] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );
        throw new ValidationError("Validation failed", details);
      }
      throw error;
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      Object.assign(req.query, validated);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.reduce(
          (acc, err) => {
            acc[err.path.join(".")] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );
        throw new ValidationError("Query validation failed", details);
      }
      throw error;
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.reduce(
          (acc, err) => {
            acc[err.path.join(".")] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );
        throw new ValidationError("Params validation failed", details);
      }
      throw error;
    }
  };
};

// ============= Helper untuk validasi function (non-middleware) =============

/**
 * Fungsi helper untuk validasi data di luar middleware
 * Useful untuk validasi CSV atau data internal
 */
export const validateData = <T>(data: any, schema: z.ZodSchema<T>) => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.reduce(
        (acc, err) => {
          acc[err.path.join(".")] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );
      throw new ValidationError("Validation failed", details);
    }
    throw error;
  }
};

/**
 * Safe validation - return result object instead of throwing
 */
export const validateDataSafe = <T>(
  data: any,
  schema: z.ZodSchema<T>
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.reduce(
        (acc, err) => {
          acc[err.path.join(".")] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );
      return { success: false, errors: details };
    }
    throw error;
  }
};

/**
 * Validasi CSV records dengan batch error handling
 */
export const validateCsvRecords = <T>(
  records: any[],
  schema: z.ZodSchema<T>
): {
  valid: T[];
  invalid: { rowNumber: number; data: any; errors: Record<string, string> }[];
} => {
  const valid: T[] = [];
  const invalid: { rowNumber: number; data: any; errors: Record<string, string> }[] = [];

  for (let i = 0; i < records.length; i++) {
    const result = validateDataSafe(records[i], schema);

    if (!result.success) {
      invalid.push({
        rowNumber: i + 2, // i + 2 karena header row + 1-based index
        data: records[i],
        errors: result.errors!,
      });
    } else {
      valid.push(result.data!);
    }
  }

  return { valid, invalid };
};

/**
 * Middleware untuk validasi CSV array dengan error handling
 */
export const validateCsvMiddleware = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      throw new ValidationError("File upload failed", {
        file: "No file uploaded",
      });
    }

    const csvBuffer = req.file.buffer;
    const records = [];
    const parser = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ";",
    });
    for await (const record of parser) {
      records.push(record);
    }

    console.log("records", records);

    const { valid, invalid } = validateCsvRecords(records, schema);
    console.log("valid", valid);
    console.log("invalid", invalid);

    if (invalid.length > 0) {
      // Format errors untuk response
      const errorDetails = invalid.reduce(
        (acc, inv) => {
          const rowErrors = Object.entries(inv.errors).map(
            ([field, msg]) => `Row ${inv.rowNumber}, ${field}: ${msg}`
          );
          return { ...acc, [`row_${inv.rowNumber}`]: rowErrors.join("; ") };
        },
        {} as Record<string, string>
      );

      throw new ValidationError(
        `CSV validation failed - ${invalid.length} rows invalid`,
        errorDetails
      );
    }

    req.body = valid;
    next();
  };
};

/**
 * Middleware untuk validasi Body dengan File
 */

export const validateBodyWithFile = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse({ ...req.body, file: req.file });
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.reduce(
          (acc, err) => {
            acc[err.path.join(".")] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );
        throw new ValidationError("Validation failed", details);
      }
      throw error;
    }
  };
};
