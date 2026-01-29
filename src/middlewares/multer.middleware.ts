import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { ValidationError } from "@/utils/errors";
import { handleMulterError } from "@/utils/errors/multer-error-handler";

// ============= 1. Error Handler Wrapper (The Magic Function) =============

/**
 * Higher-Order Function untuk membungkus eksekusi Multer dengan Error Handling yang seragam.
 * Ini mengubah Multer instance menjadi Middleware yang aman.
 */
const createMulterHandler = (
  multerInstance: multer.Multer,
  type: "single" | "array" | "fields",
  fieldName: string = "file",
  maxCount?: number
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    let uploadDelegate;

    // Tentukan metode upload berdasarkan tipe
    if (type === "single") {
      uploadDelegate = multerInstance.single(fieldName);
    } else if (type === "array") {
      uploadDelegate = multerInstance.array(fieldName, maxCount);
    } else {
      // Fallback atau custom logic jika butuh .fields() atau .any()
      uploadDelegate = multerInstance.any();
    }

    // Eksekusi Multer
    uploadDelegate(req, res, (err: any) => {
      if (err) {
        return next(handleMulterError(err));
      }
      next();
    });
  };
};

// ============= 2. Utility Functions =============

const ensureUploadDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const generateFilename = (originalName: string): string => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}-${uniqueSuffix}${ext}`;
};

// ============= 3. File Filters =============

const csvFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!file) {
    cb(new ValidationError("File upload failed", { file: "No file uploaded" }));
    return;
  }
  const allowedMimes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || fileExt === ".csv") {
    cb(null, true);
  } else {
    cb(
      new ValidationError("File upload failed", {
        file: `File type not supported. Expected CSV, got ${file.mimetype}`,
      })
    );
  }
};

const csvFileFilterOptional = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!file) {
    cb(null, true);
    return;
  }

  const allowedMimes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || fileExt === ".csv") {
    cb(null, true);
  } else {
    cb(
      new ValidationError("File upload failed", {
        file: `File type not supported. Expected CSV, got ${file.mimetype}`,
      })
    );
  }
};

const pdfFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  console.log("file", file);
  
  if (!file) {
    cb(new ValidationError("File upload failed", { file: "No file uploaded" }));
    return; 
  }
  const allowedMimes = ["application/pdf"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || fileExt === ".pdf") {
    cb(null, true);
  } else {
    cb(
      new ValidationError("File upload failed", {
        file: `File type not supported. Expected PDF, got ${file.mimetype}`,
      })
    );
  }
};

const pdfFileFilterOptional = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!file) {
    cb(null, true);
    return;
  }

  const allowedMimes = ["application/pdf"];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || fileExt === ".pdf") {
    cb(null, true);
  } else {
    cb(
      new ValidationError("File upload failed", {
        file: `File type not supported. Expected PDF, got ${file.mimetype}`,
      })
    );
  }
};

const createFileFilter = (allowedMimes: string[], allowedExtensions: string[]) => {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError("File upload failed", {
          file: `Unsupported file type: ${file.mimetype}`,
        })
      );
    }
  };
};

// ============= 4. Multer Instances (Configurations) =============
// Kita definisikan konfigurasi dulu, baru di-export sebagai middleware

// --- CSV Configs ---
const csvMemoryConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const csvDiskConfig = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads", "csv");
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
  }),
  fileFilter: csvFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const csvMemoryDiskConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilterOptional,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const csvDiskOptionalConfig = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads", "csv");
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
  }),
  fileFilter: csvFileFilterOptional,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// --- PDF Configs ---
const pdfMemoryConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const pdfDiskConfig = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads", "pdf");
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
  }),
  fileFilter: pdfFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const pdfMemoryOptionalConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilterOptional,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const pdfDiskOptionalConfig = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads", "pdf");
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
  }),
  fileFilter: pdfFileFilterOptional,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// --- Batch Config ---
const batchDiskConfig = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads", "batch");
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
  }),
  fileFilter: csvFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit per file
});

export const uploadCsvMemory = createMulterHandler(csvMemoryConfig, "single", "file");

export const uploadPdfMemory = createMulterHandler(pdfMemoryConfig, "single", "file");

export const uploadCsvMemoryOptional = createMulterHandler(csvMemoryDiskConfig, "single", "file");

export const uploadPdfMemoryOptional = createMulterHandler(
  pdfMemoryOptionalConfig,
  "single",
  "file"
);

export const uploadCsvDisk = createMulterHandler(csvDiskConfig, "single", "file");

export const uploadPdfDisk = createMulterHandler(pdfDiskConfig, "single", "file");

export const uploadCsvDiskOptional = createMulterHandler(csvDiskOptionalConfig, "single", "file");

export const uploadPdfDiskOptional = createMulterHandler(pdfDiskOptionalConfig, "single", "file");

export const uploadBatchDisk = createMulterHandler(batchDiskConfig, "array", "files", 5);

export const createDiskStorageMiddleware = (options: {
  uploadDir: string;
  mimeTypes: string[];
  extensions: string[];
  maxSize?: number;
  fieldName?: string; // Default 'file'
}) => {
  const {
    uploadDir,
    mimeTypes,
    extensions,
    maxSize = 50 * 1024 * 1024,
    fieldName = "file",
  } = options;

  const config = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.join(process.cwd(), uploadDir);
        ensureUploadDir(dir);
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
    }),
    fileFilter: createFileFilter(mimeTypes, extensions),
    limits: { fileSize: maxSize },
  });

  // Return wrapped middleware
  return createMulterHandler(config, "single", fieldName);
};
