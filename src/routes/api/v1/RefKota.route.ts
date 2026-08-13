import { Router } from "express";
import z from "zod";
import { RefKotaControllerV1 } from "@/controllers/v1/refKota.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router();

const createKotaSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{5}$/),
  kota: z.string("Kota is required").max(100).toUpperCase(),
});

const updateKotaSchema = createKotaSchema.partial();

router.get("/RefKota", authorizeScopes(["mutasi.refKota.read"]), RefKotaControllerV1.getAll);
router.get("/RefKota/:id", authorizeScopes(["mutasi.refKota.read"]), RefKotaControllerV1.getById);
router.post(
  "/RefKota",
  validateBody(createKotaSchema),
  authorizeScopes(["mutasi.refKota.write"]),
  RefKotaControllerV1.create
);
router.patch(
  "/RefKota/:id",
  validateBody(updateKotaSchema),
  authorizeScopes(["mutasi.refKota.update"]),
  RefKotaControllerV1.update
);
router.delete(
  "/RefKota/:id",
  authorizeScopes(["mutasi.refKota.delete"]),
  RefKotaControllerV1.delete
);

export default router;
