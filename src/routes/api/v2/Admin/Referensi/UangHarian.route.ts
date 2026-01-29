import { Router } from "express";
import { UangHarianControllerV2 } from "@/controllers/v2/admin/referensi/uangHarian.controller";
import z from "zod";
import { validateBody } from "@/middlewares/validate-request.middleware";
const router = Router({ mergeParams: true });

const createUangHarianSchema = z.object({
  kode_provinsi: z
    .string("Kode provinsi is required")
    .regex(/^\d{3}$/, "Kode provinsi must be 3 digits"),
  tarif: z.number("Tarif is required").min(0),
});

const updateUangHarianSchema = createUangHarianSchema.partial();

router.get("/", UangHarianControllerV2.getAll);
router.get("/:id", UangHarianControllerV2.getById);
router.post("/", validateBody(createUangHarianSchema), UangHarianControllerV2.create);
router.patch("/:id", validateBody(updateUangHarianSchema), UangHarianControllerV2.update);
router.delete("/:id", UangHarianControllerV2.delete);
export default router;
