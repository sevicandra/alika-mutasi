import { Router } from "express";
import z from "zod";
import { DaratControllerV2 } from "@/controllers/v2/admin/referensi/darat.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createDaratSchema = z.object({
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
  kota_asal: z.string("Kota asal is required").regex(/^\d{5}$/, "Kode kota asal tidak valid"),
  kota_tujuan: z.string("Kota tujuan is required").regex(/^\d{5}$/, "Kode kota tujuan tidak valid"),
  jarak: z.number("Jarak is required").min(0),
  pulau: z
    .string("Pulau is required")
    .toUpperCase()
    .pipe(z.enum(["JAWA", "LUAR_JAWA"])),
});

const updateDaratSchema = createDaratSchema.partial();

router.get("/", DaratControllerV2.getAll);
router.get("/:id", DaratControllerV2.getById);
router.post("/", validateBody(createDaratSchema), DaratControllerV2.create);
router.patch("/:id", validateBody(updateDaratSchema), DaratControllerV2.update);
router.delete("/:id", DaratControllerV2.delete);
export default router;
