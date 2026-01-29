import { Router } from "express";
import z from "zod";
import { KantorControllerV2 } from "@/controllers/v2/admin/referensi/kantor.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createKantorSchema = z.object({
  kode_kota: z
    .string("Kode Kota is required")
    .min(1, "Kode Kota is required")
    .regex(/^\d{5}$/, "Kode Kota must be 5 digits"),
  kode_satker: z
    .string("Kode Satker is required")
    .min(1, "Kode Satker is required")
    .regex(/^\d{6}$/, "Kode Satker must be 6 digits"),
  kantor: z.string("kantor is required").max(100, "Max length is 100").min(1, "kantor is required"),
});

const updateKantorSchema = createKantorSchema.partial();

router.get("/", KantorControllerV2.getAll);
router.get("/:KodeSatker", KantorControllerV2.getById);
router.post("/", validateBody(createKantorSchema), KantorControllerV2.create);
router.patch("/:KodeSatker", validateBody(updateKantorSchema), KantorControllerV2.update);
router.delete("/:KodeSatker", KantorControllerV2.delete);
export default router;
