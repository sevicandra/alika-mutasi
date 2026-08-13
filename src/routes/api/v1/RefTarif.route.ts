import { Router } from "express";
import z from "zod";
import { RefTarifControllerV1 } from "@/controllers/v1/refTarif.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createTarifSchema = z.object({
  tarif: z.number("Tarif is required").min(0),
  jenis: z.enum([
    "TRANSPORT_DARAT_ORANG",
    "TRANSPORT_DARAT_BARANG",
    "PACKING_DARAT",
    "PACKING_LAUT",
    "PACKING_UDARA",
    "UANG_HARIAN",
  ]),
});

const updateTarifSchema = createTarifSchema.partial();

router.get("/", authorizeScopes(["mutasi.refTarif.read"]), RefTarifControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.refTarif.read"]), RefTarifControllerV1.getById);
router.post(
  "/",
  validateBody(createTarifSchema),
  authorizeScopes(["mutasi.refTarif.write"]),
  RefTarifControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateTarifSchema),
  authorizeScopes(["mutasi.refTarif.update"]),
  RefTarifControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.refTarif.delete"]), RefTarifControllerV1.delete);
export default router;
