import { Router } from "express";
import { KapalControllerV2 } from "@/controllers/v2/admin/referensi/kapal.controller";
import z from "zod";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createKapalSchema = z.object({
  rute: z
    .string("Rute is required")
    .regex(/^([A-Za-z\s]+)([-])([A-Za-z\s]+)$/, "Format rute tidak valid")
    .transform((val) => {
      const parts = val.split("-");
      return parts
        .map((part) => part.trim())
        .join("-")
        .toUpperCase();
    }),
  kapal: z.string("Kapal is required").max(100),
  kota_asal: z
    .string("Kota asal is required")
    .regex(/^[0-9]{5}$/, "Kota asal must be 5 digit number"),
  kota_tujuan: z
    .string("Kota tujuan is required")
    .regex(/^[0-9]{5}$/, "Kota tujuan must be 5 digit number"),
  tarif: z.number("Tarif is required").min(0),
});

const updateKapalSchema = createKapalSchema.partial();

router.get("/", KapalControllerV2.getAll);
router.get("/:id", KapalControllerV2.getById);
router.post("/", validateBody(createKapalSchema), KapalControllerV2.create);
router.patch("/:id", validateBody(updateKapalSchema), KapalControllerV2.update);
router.delete("/:id", KapalControllerV2.delete);
export default router;
