import { Router } from "express";
import z from "zod";
import { GolonganControllerV1 } from "@/controllers/v1/golongan.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router();

const createSchema = z.object({
  kode: z.string().regex(/^\d{2}$/, "Kode must be 2 digits"),
  nama: z
    .string("Required")
    .max(50, "Nama must be at most 50 characters")
    .min(3, "Nama must be at least 3 characters"),
});

const updateSchema = z.object({
  kode: z
    .string()
    .regex(/^\d{2}$/, "Kode must be 2 digits")
    .optional(),
  nama: z
    .string("Required")
    .max(50, "Nama must be at most 50 characters")
    .min(3, "Nama must be at least 3 characters")
    .optional(),
});

router.get("/", authorizeScopes(["mutasi.golongan.read"]), GolonganControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.golongan.read"]), GolonganControllerV1.getById);
router.post(
  "/",
  validateBody(createSchema),
  authorizeScopes(["mutasi.golongan.write"]),
  GolonganControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateSchema),
  authorizeScopes(["mutasi.golongan.update"]),
  GolonganControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.golongan.delete"]), GolonganControllerV1.delete);
export default router;
