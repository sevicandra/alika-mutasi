import { Router } from "express";
import z from "zod";
import { RefGolonganControllerV1 } from "@/controllers/v1/refGolongan.controller";
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

router.get("/", authorizeScopes(["mutasi.refGolongan.read"]), RefGolonganControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.refGolongan.read"]), RefGolonganControllerV1.getById);
router.post(
  "/",
  validateBody(createSchema),
  authorizeScopes(["mutasi.refGolongan.write"]),
  RefGolonganControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateSchema),
  authorizeScopes(["mutasi.refGolongan.update"]),
  RefGolonganControllerV1.update
);
router.delete(
  "/:id",
  authorizeScopes(["mutasi.refGolongan.delete"]),
  RefGolonganControllerV1.delete
);
export default router;
