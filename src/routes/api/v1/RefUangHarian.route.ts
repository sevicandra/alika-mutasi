import { Router } from "express";
import z from "zod";
import { RefUangHarianControllerV1 } from "@/controllers/v1/refUangHarian.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createUangHarianSchema = z.object({
  kode_provinsi: z
    .string("Kode provinsi is required")
    .regex(/^\d{3}$/, "Kode provinsi must be 3 digits"),
  tarif: z.number("Tarif is required").min(0),
});

const updateUangHarianSchema = createUangHarianSchema.partial();

router.get("/", authorizeScopes(["mutasi.refUangHarian.read"]), RefUangHarianControllerV1.getAll);
router.get(
  "/:id",
  authorizeScopes(["mutasi.refUangHarian.read"]),
  RefUangHarianControllerV1.getById
);
router.post(
  "/",
  validateBody(createUangHarianSchema),
  authorizeScopes(["mutasi.refUangHarian.write"]),
  RefUangHarianControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateUangHarianSchema),
  authorizeScopes(["mutasi.refUangHarian.update"]),
  RefUangHarianControllerV1.update
);
router.delete(
  "/:id",
  authorizeScopes(["mutasi.refUangHarian.delete"]),
  RefUangHarianControllerV1.delete
);
export default router;
