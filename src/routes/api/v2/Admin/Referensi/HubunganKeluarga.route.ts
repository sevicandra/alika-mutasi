import { Router } from "express";
import z from "zod";
import { HubunganKeluargaControllerV2 } from "@/controllers/v2/admin/referensi/hubunganKeluarga.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createHubunganKeluargaSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{2}$/, "Kode must be 2 digits"),
  nama: z.string("Nama is required").min(3).max(100),
  jenis: z.enum(["PASANGAN", "ANAK", "LAINNYA"]).default("LAINNYA"),
});

const updateHubunganKeluargaSchema = createHubunganKeluargaSchema.partial();

router.get("/", HubunganKeluargaControllerV2.getAll);
router.get("/:id", HubunganKeluargaControllerV2.getById);
router.post("/", validateBody(createHubunganKeluargaSchema), HubunganKeluargaControllerV2.create);
router.patch(
  "/:id",
  validateBody(updateHubunganKeluargaSchema),
  HubunganKeluargaControllerV2.update
);
router.delete("/:id", HubunganKeluargaControllerV2.delete);
export default router;
