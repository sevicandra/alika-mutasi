import { Router } from "express";
import z from "zod";
import { pesawatControllerV2 } from "@/controllers/v2/admin/referensi/pesawat.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createPesawatSchema = z.object({
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
  ekonomi: z.number("Ekonomi is required").min(0, "Nilai harus lebih dari 0"),
  bisnis: z.number("Bisnis is required").min(0, "Nilai harus lebih dari 0"),
  jenis_tarif: z.enum(["SBM", "NON_SBM"], "Jenis tarif tidak valid"),
});

const updatePesawatSchema = createPesawatSchema.partial();

router.get("/", pesawatControllerV2.getAll);
router.get("/:id", pesawatControllerV2.getById);
router.post("/", validateBody(createPesawatSchema), pesawatControllerV2.create);
router.patch("/:id", validateBody(updatePesawatSchema), pesawatControllerV2.update);
router.delete("/:id", pesawatControllerV2.delete);
export default router;
