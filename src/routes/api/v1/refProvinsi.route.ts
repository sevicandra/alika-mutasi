import { Router } from "express";
import z from "zod";
import { RefProvinsiControllerV1 } from "@/controllers/v1/refProvinsi.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createProvinsiSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{3}$/),
  provinsi: z.string("Provinsi is required").max(100).toUpperCase(),
});

const updateProvinsiSchema = createProvinsiSchema.partial();

router.get("/", authorizeScopes(["mutasi.refProvinsi.read"]), RefProvinsiControllerV1.getAll);
router.get(
  "/:KodeProv",
  authorizeScopes(["mutasi.refProvinsi.read"]),
  RefProvinsiControllerV1.getByKode
);
router.post(
  "/",
  validateBody(createProvinsiSchema),
  authorizeScopes(["mutasi.refProvinsi.write"]),
  RefProvinsiControllerV1.create
);
router.patch(
  "/:KodeProv",
  validateBody(updateProvinsiSchema),
  authorizeScopes(["mutasi.refProvinsi.update"]),
  RefProvinsiControllerV1.update
);
router.delete(
  "/:KodeProv",
  authorizeScopes(["mutasi.refProvinsi.delete"]),
  RefProvinsiControllerV1.delete
);
export default router;
