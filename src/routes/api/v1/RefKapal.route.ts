import { Router } from "express";
import z from "zod";
import { RefKapalControllerV1 } from "@/controllers/v1/refKapal.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
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

router.get("/", authorizeScopes(["mutasi.refKapal.read"]), RefKapalControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.refKapal.read"]), RefKapalControllerV1.getById);
router.post(
  "/",
  validateBody(createKapalSchema),
  authorizeScopes(["mutasi.refKapal.write"]),
  RefKapalControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateKapalSchema),
  authorizeScopes(["mutasi.refKapal.update"]),
  RefKapalControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.refKapal.delete"]), RefKapalControllerV1.delete);
export default router;
