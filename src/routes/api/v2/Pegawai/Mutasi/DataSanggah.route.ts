import { Router } from "express";
import z from "zod";
import { DataSanggahController } from "@/controllers/v2/pegawai/dataSanggah.controller";
import { uploadPdfDisk } from "@/middlewares/multer.middleware";
import { validateBodyWithFile } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const addSchema = z
  .object({
    action: z
      .string("Action is Required")
      .toUpperCase()
      .pipe(z.enum(["ADD", "EDIT", "REMOVE"])),
    keluarga_id: z.string("Keluarga ID Action is Required").optional(),
    nama: z.string("Nama Action is Required").optional(),
    nik: z
      .string("NIK Action is Required")
      .regex(/^\d{16}$/, "NIK harus berupa angka")
      .optional(),
    hubungan: z
      .string("Hubungan Action is Required")
      .regex(/^\d+$/, "Hubungan harus berupa angka")
      .optional(),
    tanggal_lahir: z.string("Tanggal Lahir Action is Required").optional(),
    pekerjaan: z.string("Pekerjaan Action is Required").optional(),
    status: z.string("Status Action is Required").optional(),
    catatan: z.string("Catatan Action is Required").optional(),
    file: z
      .object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(["application/pdf"], "Format file tidak didukung. Harap upload PDF."),
        size: z.number().max(50 * 1024 * 1024, {
          message: `Ukuran file maksimal adalah 50MB.`,
        }),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === "EDIT" || val.action === "REMOVE") {
      if (!val.keluarga_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keluarga ID harus diisi",
          path: ["keluarga_id"],
        });
      }
    }
    if (val.action === "ADD") {
      if (!val.nama) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama harus diisi",
          path: ["nama"],
        });
      }
      if (!val.hubungan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hubungan harus diisi",
          path: ["hubungan"],
        });
      }
      if (!val.tanggal_lahir) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal Lahir harus diisi",
          path: ["tanggal_lahir"],
        });
      }
      if (!val.pekerjaan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pekerjaan harus diisi",
          path: ["pekerjaan"],
        });
      }
      if (!val.status) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Status harus diisi",
          path: ["status"],
        });
      }
    }
    if (!val.catatan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Catatan harus diisi",
        path: ["catatan"],
      });
    }
    if (val.action === "EDIT" || val.action === "ADD") {
      if (!val.file) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File harus diisi",
          path: ["file"],
        });
      }
      if (!val.nik) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "NIK harus diisi",
          path: ["nik"],
        });
      }
    }
  });

router.get("/", DataSanggahController.getAll);
router.post("/", uploadPdfDisk, validateBodyWithFile(addSchema), DataSanggahController.create);
router.delete("/:dataId", DataSanggahController.delete);
router.get("/:dataId/File", DataSanggahController.getFile);
export default router;
