import { Router } from "express";
import { TarifControllerV2 } from "@/controllers/v2/admin/referensi/tarif.controller";
import z from "zod";
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

router.get("/", TarifControllerV2.getAll);
router.get("/:id", TarifControllerV2.getById);
router.post("/", validateBody(createTarifSchema), TarifControllerV2.create);
router.patch("/:id", validateBody(updateTarifSchema), TarifControllerV2.update);
router.delete("/:id", TarifControllerV2.delete);
export default router;
