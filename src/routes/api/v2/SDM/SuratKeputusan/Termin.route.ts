import { Router } from "express";
import z from "zod";
import { TerminControllerV2 } from "@/controllers/v2/sdm/termin.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createSchema = z.object({
  ref_termin: z
    .string("Ref Termin is required")
    .regex(/^\d{2}$/, "Ref Termin must be 2 digit code"),
  nominal: z.number("Nominal is required").positive("Nominal must be positive"),
  tahun: z.string("Tahun is required").regex(/^[0-9]{4}$/, "Tahun must be 4 digits"),
});

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

const updateSchema = createSchema.partial();

router.get("/", TerminControllerV2.getAll);
router.get("/:TerminId", TerminControllerV2.getById);
router.post("/", validateBody(createSchema), TerminControllerV2.create);
router.post("/Reset", TerminControllerV2.reset);
router.post("/Process", validateBody(processTerminSchema), TerminControllerV2.processTermin);
router.patch("/:TerminId", validateBody(updateSchema), TerminControllerV2.update);
router.delete("/:TerminId", TerminControllerV2.delete);
router.get("/:TerminId/Dokumen", TerminControllerV2.getDokumen);
router.get("/:TerminId/Dokumen/:DokumenId/File", TerminControllerV2.getDokumenFile);

export default router;
