import { Router } from "express";
import z from "zod";
import { KeluargaControllerV1 } from "@/controllers/v1/Keluarga.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createSchema = z.object({
  pegawai_id: z.string("Pegawai ID is required").uuid("Invalid pegawai_id"),
  nik: z.string("NIK is required").max(16, "NIK must be at most 16 characters"),
  nama: z.string("Nama is required").max(100, "Nama must be at most 100 characters"),
  hubungan: z.string("Hubungan is required").max(2, "Hubungan must be at most 2 characters"),
  tanggal_lahir: z
    .string("Tanggal lahir is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir must be in YYYY-MM-DD format"),
  is_invant: z.boolean("Is invant is required").default(false),
  pekerjaan: z.string("Pekerjaan is required").max(50, "Pekerjaan must be at most 50 characters"),
  status: z.enum(
    ["TERTANGGUNG", "TIDAK_TERTANGGUNG"],
    "Status must be either TERTANGGUNG or TIDAK_TERTANGGUNG"
  ),
});

const updateSchema = createSchema.partial();

router.get("/", authorizeScopes(["mutasi.keluarga.read"]), KeluargaControllerV1.getAll);
router.get("/:id", authorizeScopes(["mutasi.keluarga.read"]), KeluargaControllerV1.getById);
router.post(
  "/",
  validateBody(createSchema),
  authorizeScopes(["mutasi.keluarga.write"]),
  KeluargaControllerV1.create
);
router.patch(
  "/:id",
  validateBody(updateSchema),
  authorizeScopes(["mutasi.keluarga.update"]),
  KeluargaControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.keluarga.delete"]), KeluargaControllerV1.delete);
export default router;
