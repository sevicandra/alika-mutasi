import { Router } from "express";
import z from "zod";
import { RefTerminControllerV1 } from "@/controllers/v1/refTermin.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createTerminSchema = z.object({
  kode: z.string("Kode is required").regex(/^\d{2}$/),
  nama: z.string("Nama is required").max(100).toUpperCase(),
  required_doc: z.array(
    z.object({
      jenis: z.string().toUpperCase(),
      required: z.boolean(),
      upload: z.boolean(),
      penandatatangan: z.array(z.string().toUpperCase()),
    })
  ),
  urutan: z.number("Urutan is required"),
});

const updateTarifSchema = createTerminSchema.partial();

router.get("/", authorizeScopes(["mutasi.refTermin.read"]), RefTerminControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.refTermin.read"]), RefTerminControllerV1.getById);
router.post(
  "/",
  validateBody(createTerminSchema),
  authorizeScopes(["mutasi.refTermin.write"]),
  RefTerminControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateTarifSchema),
  authorizeScopes(["mutasi.refTermin.update"]),
  RefTerminControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.refTermin.delete"]), RefTerminControllerV1.delete);
export default router;
