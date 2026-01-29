import { Router } from "express";
import z from "zod";
import { KeluargaControllerV2 } from "@/controllers/v2/sdm/keluarga.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createSchema = z.object({
  nik: z
    .string("NIK is required")
    .regex(/^\d{16}$/, "NIK must be exactly 16 digits")
    .min(1, "NIK is required"),
  nama: z
    .string("Nama is required")
    .max(100, "Nama must be at most 100 characters")
    .min(1, "Nama is required"),
  hubungan: z
    .string("Hubungan is required")
    .max(2, "Hubungan must be at most 2 characters")
    .min(1, "Hubungan is required"),
  tanggal_lahir: z
    .string("Tanggal lahir is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir must be in YYYY-MM-DD format")
    .min(1, "Tanggal lahir is required"),
  is_invant: z.boolean().optional(),
  pekerjaan: z
    .string("Pekerjaan is required")
    .max(50, "Pekerjaan must be at most 50 characters")
    .min(1, "Pekerjaan is required"),
  status: z
    .string("Status is required")
    .toUpperCase()
    .min(1, "Status is required")
    .pipe(
      z.enum(
        ["TERTANGGUNG", "TIDAK_TERTANGGUNG"],
        "Status must be either TERTANGGUNG or TIDAK_TERTANGGUNG"
      )
    ),
});

const updateSchema = createSchema.partial();

router.get("/", KeluargaControllerV2.getAll);
router.get("/:KeluargaId", KeluargaControllerV2.getById);
router.post("/", validateBody(createSchema), KeluargaControllerV2.create);
router.patch("/:KeluargaId", validateBody(updateSchema), KeluargaControllerV2.update);
router.delete("/:KeluargaId", KeluargaControllerV2.delete);
router.get("/:KeluargaId/File", KeluargaControllerV2.getFile);

export default router;
