import { Router } from "express";
import z from "zod";
import { BarangControllerV2 } from "@/controllers/v2/admin/referensi/barang.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createBarangSchema = z.object({
  golongan: z.string("Golongan is required").regex(/^[0-9]{1}$/, "Golongan must be a 1 digit number"),
  status: z.enum(
    ["TIDAK_BERKELUARGA", "BERKELUARGA_TANPA_ANAK", "BERKELUARGA_DENGAN_ANAK"],
    "status is not valid"
  ),
  volume: z.number("Volume is required").min(1, "Volume must be greater than 0"),
});

const updateBarangSchema = createBarangSchema.partial();

router.get("/", BarangControllerV2.getAll);
router.get("/:id", BarangControllerV2.getById);
router.post("/", validateBody(createBarangSchema), BarangControllerV2.create);
router.patch("/:id", validateBody(updateBarangSchema), BarangControllerV2.update);
router.delete("/:id", BarangControllerV2.delete);

export default router;
