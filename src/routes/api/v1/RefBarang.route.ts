import { Router } from "express";
import z from "zod";
import { RefBarangControllerV1 } from "@/controllers/v1/refBarang.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createBarangSchema = z.object({
  golongan: z
    .string("Golongan is required")
    .regex(/^[0-9]{1}$/, "Golongan must be a 1 digit number"),
  status: z.enum(
    ["TIDAK_BERKELUARGA", "BERKELUARGA_TANPA_ANAK", "BERKELUARGA_DENGAN_ANAK"],
    "status is not valid"
  ),
  volume: z.number("Volume is required").min(1, "Volume must be greater than 0"),
});

const updateBarangSchema = createBarangSchema.partial();

router.get("/", authorizeScopes(["mutasi.refBarang.read"]), RefBarangControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.refBarang.read"]), RefBarangControllerV1.getById);
router.post(
  "/",
  authorizeScopes(["mutasi.refBarang.write"]),
  validateBody(createBarangSchema),
  RefBarangControllerV1.create
);
router.patch(
  "/:id",
  authorizeScopes(["mutasi.refBarang.update"]),
  validateBody(updateBarangSchema),
  RefBarangControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.refBarang.delete"]), RefBarangControllerV1.delete);

export default router;
