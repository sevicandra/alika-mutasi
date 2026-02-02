import { Router } from "express";
import { z } from "zod";
import { SuratKeputusanControllerV2 } from "@/controllers/v2/sdm/suratKeputusan.controller";
import { uploadPdfDisk, uploadPdfDiskOptional } from "@/middlewares/multer.middleware";
import { validateBody, validateBodyWithFile } from "@/middlewares/validate-request.middleware";

const router = Router();

const createSchema = z.object({
  nomor: z
    .string("Nomor is required")
    .max(100, "Nomor must be at most 100 characters")
    .min(1, "Nomor is required"),
  uraian: z
    .string("Uraian is required")
    .max(255, "Uraian must be at most 255 characters")
    .min(1, "Uraian is required"),
  tanggal: z
    .string("Tanggal is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal must be in YYYY-MM-DD format")
    .min(1, "Tanggal is required"),
  tmt: z
    .string("TMT is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "TMT must be in YYYY-MM-DD format")
    .min(1, "TMT is required"),
  jenjang: z
    .string("Jenjang is required")
    .min(1, "Jenjang is required")
    .toUpperCase()
    .pipe(
      z.enum([
        "ESELON I",
        "ESELON II",
        "ESELON III",
        "ESELON IV",
        "JABATAN FUNGSIONAL",
        "PELAKSANA",
        "PENSIUN",
      ])
    ),
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum(["application/pdf"], "Format file tidak didukung. Harap upload PDF."),
    size: z.number().max(50 * 1024 * 1024, {
      message: `Ukuran file maksimal adalah 50MB.`,
    }),
  }),
});

const updateSchema = createSchema.partial();

const processTerminSchema = z
  .object({
    percentage: z
      .number("Percentage is required")
      .positive("Percentage must be positive")
      .optional(),
    maximum: z.number("Maximum is required").positive("Maximum must be positive").default(0),
    tahun_uang_muka: z
      .string("Tahun Uang Muka is required")
      .regex(/^(19[6-9]\d|20\d{2})$/, "Invalid tahun uang muka")
      .min(1, "Tahun Uang Muka is required")
      .optional(),
    tahun_lunas: z
      .string("Tahun Lunas is required")
      .regex(/^(19[6-9]\d|20\d{2})$/, "Invalid tahun lunas")
      .min(1, "Tahun Lunas is required"),
    type: z
      .string("Type is required")
      .toUpperCase()
      .min(1, "Type is required")
      .pipe(z.enum(["UANG_MUKA", "LUNAS"])),
  })
  .superRefine((data, ctx) => {
    const tahunUangMuka = Number(data.tahun_uang_muka);
    const tahunLunas = Number(data.tahun_lunas);

    if (data.type === "UANG_MUKA") {
      if (!Number.isNaN(tahunUangMuka) && !Number.isNaN(tahunLunas)) {
        if (tahunUangMuka > tahunLunas) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tahun uang muka cannot be greater than tahun lunas",
            path: ["tahun_uang_muka"],
          });
        }
      }
      if (data.percentage === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage is required when type is UANG_MUKA",
          path: ["percentage"],
        });
      }
      if (data.tahun_uang_muka === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tahun uang muka is required when type is UANG_MUKA",
          path: ["tahun_uang_muka"],
        });
      }
    }
  });

const timelineSchema = z.object({
  timeline_sanggah: z
    .string("Timeline Sanggah is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Timeline Sanggah must be in YYYY-MM-DD format"),
  timeline_verifikasi: z
    .string("Timeline Verifikasi is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Timeline Verifikasi must be in YYYY-MM-DD format"),
  timeline_spm: z
    .string("Timeline SPM is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Timeline SPM must be in YYYY-MM-DD format"),
});

router.get("/", SuratKeputusanControllerV2.getAll);
router.get("/Count", SuratKeputusanControllerV2.count);
router.post(
  "/",
  uploadPdfDisk,
  validateBodyWithFile(createSchema),
  SuratKeputusanControllerV2.create
);
router.get("/:SkId", SuratKeputusanControllerV2.getById);
router.patch(
  "/:SkId",
  uploadPdfDiskOptional,
  validateBodyWithFile(updateSchema),
  SuratKeputusanControllerV2.update
);
router.delete("/:SkId", SuratKeputusanControllerV2.delete);
router.get("/:SkId/File", SuratKeputusanControllerV2.getFile);

router.post("/:SkId/ProcessKeluarga", SuratKeputusanControllerV2.processKeluarga);
router.post("/:SkId/ProcessBiaya", SuratKeputusanControllerV2.hitungBiaya);
router.post(
  "/:SkId/ProcessTermin",
  validateBody(processTerminSchema),
  SuratKeputusanControllerV2.processTermin
);
router.post("/:SkId/Publish", SuratKeputusanControllerV2.publish);
router.post(
  "/:SkId/SetTimeline",
  validateBody(timelineSchema),
  SuratKeputusanControllerV2.setTimeline
);
router.get("/:SkId/Overview", SuratKeputusanControllerV2.getOverview);
router.get("/:SkId/OverviewCSV", SuratKeputusanControllerV2.getOverviewCSV);
router.post("/:SkId/Batal", SuratKeputusanControllerV2.batal);
router.post("/:SkId/Selesai", SuratKeputusanControllerV2.selesai);

export default router;
