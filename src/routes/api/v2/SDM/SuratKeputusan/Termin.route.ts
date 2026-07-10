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

const updateSchema = createSchema.partial();

router.get("/", TerminControllerV2.getAll);
router.get("/:TerminId", TerminControllerV2.getById);
router.post("/", validateBody(createSchema), TerminControllerV2.create);
router.post("/Reset", TerminControllerV2.reset);
router.post("/process", TerminControllerV2.processTermin);
router.patch("/:TerminId", validateBody(updateSchema), TerminControllerV2.update);
router.delete("/:TerminId", TerminControllerV2.delete);
router.get("/:TerminId/Dokumen", TerminControllerV2.getDokumen);
router.get("/:TerminId/Dokumen/:DokumenId/File", TerminControllerV2.getDokumenFile);

export default router;
