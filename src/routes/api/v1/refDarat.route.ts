import { Router } from "express";
import z from "zod";
import { RefDaratControllerV1 } from "@/controllers/v1/refDarat.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
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

router.get("/", authorizeScopes(["mutasi.refDarat.read"]), RefDaratControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.refDarat.read"]), RefDaratControllerV1.getById);
router.post(
  "/",
  authorizeScopes(["mutasi.refDarat.write"]),
  validateBody(createDaratSchema),
  RefDaratControllerV1.create
);
router.patch(
  "/:id",
  authorizeScopes(["mutasi.refDarat.update"]),
  validateBody(updateDaratSchema),
  RefDaratControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.refDarat.delete"]), RefDaratControllerV1.delete);
export default router;
