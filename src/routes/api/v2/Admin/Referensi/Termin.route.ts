import { Router } from "express";
import z from "zod";
import { TerminControllerV2 } from "@/controllers/v2/admin/referensi/termin.controller";
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

router.get("/", TerminControllerV2.getAll);
router.get("/:id", TerminControllerV2.getById);
router.post("/", validateBody(createTerminSchema), TerminControllerV2.create);
router.patch("/:id", validateBody(updateTarifSchema), TerminControllerV2.update);
router.delete("/:id", TerminControllerV2.delete);
export default router;
