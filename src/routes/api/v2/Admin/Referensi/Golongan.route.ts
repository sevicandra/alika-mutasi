import { Router } from "express";
import z from "zod";
import { GolonganControllerV2 } from "@/controllers/v2/admin/referensi/golongan.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createGolonganSchema = z.object({
  kode: z
    .string("Kode is required")
    .regex(/^([1-3][A-D]|4[A-E])$/, "Invalid golongan format"),
  nama: z.string("Nama is required").min(1),
});

const updateGolonganSchema = createGolonganSchema.partial();

router.get("/", GolonganControllerV2.getAll);
router.get("/:id", GolonganControllerV2.getById);
router.post("/", validateBody(createGolonganSchema), GolonganControllerV2.create);
router.patch("/:id", validateBody(updateGolonganSchema), GolonganControllerV2.update);
router.delete("/:id", GolonganControllerV2.delete);
export default router;
