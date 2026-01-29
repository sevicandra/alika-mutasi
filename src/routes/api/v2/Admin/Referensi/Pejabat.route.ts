import { Router } from "express";
import z from "zod";
import { pejabatControllerV2 } from "@/controllers/v2/admin/referensi/pejabat.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createPejabatSchema = z.object({
  jenis: z
    .string("Jenis is required")
    .toUpperCase()
    .pipe(z.enum(["PPK", "BENDAHARA"])),
  nama: z.string("Nama is required").max(100),
  nip: z
    .string("NIP is required")
    .regex(
      /^(19[6-9]\d|20\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2]\d|3[0-1])(19[8-9]\d|20\d{2})(0[1-9]|1[0-2])([1-2])(\d{3})$/,
      "Invalid NIP"
    ),
});

const updatePejabatSchema = createPejabatSchema.partial();

router.get("/", pejabatControllerV2.getAll);
router.get("/:id", pejabatControllerV2.getById);
router.post("/", validateBody(createPejabatSchema), pejabatControllerV2.create);
router.patch("/:id", validateBody(updatePejabatSchema), pejabatControllerV2.update);
router.delete("/:id", pejabatControllerV2.delete);
export default router;
