import { Router } from "express";
import z from "zod";
import { ProvinsiControllerV2 } from "@/controllers/v2/admin/referensi/provinsi.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createProvinsiSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{3}$/),
  provinsi: z.string("Provinsi is required").max(100).toUpperCase(),
});

const updateProvinsiSchema = createProvinsiSchema.partial();

const createKotaSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{5}$/),
  kota: z.string("Kota is required").max(100).toUpperCase(),
});

const updateKotaSchema = createKotaSchema.partial();

router.get("/", ProvinsiControllerV2.getAll);
router.get("/:KodeProv", ProvinsiControllerV2.getByKode);
router.post("/", validateBody(createProvinsiSchema), ProvinsiControllerV2.create);
router.patch("/:KodeProv", validateBody(updateProvinsiSchema), ProvinsiControllerV2.update);
router.delete("/:KodeProv", ProvinsiControllerV2.delete);
router.get("/:KodeProv/Kota", ProvinsiControllerV2.getKotas);
router.get("/:KodeProv/Kota/:KodeKota", ProvinsiControllerV2.getKotaByKode);
router.post("/:KodeProv/Kota", validateBody(createKotaSchema), ProvinsiControllerV2.createKota);
router.patch(
  "/:KodeProv/Kota/:KodeKota",
  validateBody(updateKotaSchema),
  ProvinsiControllerV2.updateKota
);
router.delete("/:KodeProv/Kota/:KodeKota", ProvinsiControllerV2.deleteKota);
export default router;
