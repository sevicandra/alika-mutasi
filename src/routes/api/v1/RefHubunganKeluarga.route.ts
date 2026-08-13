import { Router } from "express";
import z from "zod";
import { RefHubunganKeluargaControllerV1 } from "@/controllers/v1/refHubunganKeluarga.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createHubunganKeluargaSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{2}$/, "Kode must be 2 digits"),
  nama: z.string("Nama is required").min(3).max(100),
  jenis: z.enum(["PASANGAN", "ANAK", "LAINNYA"]).default("LAINNYA"),
});

const updateHubunganKeluargaSchema = createHubunganKeluargaSchema.partial();

router.get(
  "/",
  authorizeScopes(["mutasi.refHubunganKeluarga.read"]),
  RefHubunganKeluargaControllerV1.getAll
);
router.get(
  "/:id",
  authorizeScopes(["mutasi.refHubunganKeluarga.read"]),
  RefHubunganKeluargaControllerV1.getById
);
router.post(
  "/",
  validateBody(createHubunganKeluargaSchema),
  authorizeScopes(["mutasi.refHubunganKeluarga.write"]),
  RefHubunganKeluargaControllerV1.create
);
router.patch(
  "/:id",
  authorizeScopes(["mutasi.refHubunganKeluarga.update"]),
  validateBody(updateHubunganKeluargaSchema),
  RefHubunganKeluargaControllerV1.update
);
router.delete(
  "/:id",
  authorizeScopes(["mutasi.refHubunganKeluarga.delete"]),
  RefHubunganKeluargaControllerV1.delete
);
export default router;
