import { Router } from "express";
import z from "zod";
import { RefKantorControllerV1 } from "@/controllers/v1/refKantor.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router();

const createSchema = z.object({
  kode_kota: z.string("Kode Kota is required").regex(/^\d{5}$/, "Kode Kota must be 5 digits"),
  kode_satker: z.string("Kode Satker is required").regex(/^\d{6}$/, "Kode Satker must be 6 digits"),
  kantor: z.string("Kantor is required").max(100, "Kantor must be at most 100 characters"),
});

const updateSchema = z.object({
  kode_kota: z
    .string()
    .regex(/^\d{5}$/, "Kode Kota must be 5 digits")
    .optional(),
  kode_satker: z
    .string()
    .regex(/^\d{6}$/, "Kode Satker must be 6 digits")
    .optional(),
  kantor: z.string().max(100, "Kantor must be at most 100 characters").optional(),
});

router.get("/", authorizeScopes(["mutasi.kantor.read"]), RefKantorControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.kantor.read"]), RefKantorControllerV1.getById);
router.post(
  "/",
  validateBody(createSchema),
  authorizeScopes(["mutasi.kantor.write"]),
  RefKantorControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateSchema),
  authorizeScopes(["mutasi.kantor.update"]),
  RefKantorControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.kantor.delete"]), RefKantorControllerV1.delete);
export default router;
