import { Router } from "express";
import z from "zod";
import { PegawaiMutasiControllerV1 } from "@/controllers/v1/pagawaiMutasi.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { uploadCsvMemory } from "@/middlewares/multer.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";
import Keluarga from "./Keluarga.route";
import RincianBiaya from "./RincianBiaya.route";

const router = Router({ mergeParams: true });

const createSchema = z.object({
  sk_id: z.string("SK ID is required").uuid("Invalid sk_id"),
  golongan: z.string("Golongan is required").max(2, "Golongan must be at most 2 characters"),
  kantor_asal: z
    .string("Kantor asal is required")
    .regex(/^\d{6}$/, "Kantor asal must be exactly 6 digits"),
  kantor_tujuan: z
    .string("Kantor tujuan is required")
    .regex(/^\d{6}$/, "Kantor tujuan must be exactly 6 digits"),
  nip: z
    .string("NIP is required")
    .regex(
      /^(19[6-9]\d|20\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2]\d|3[0-1])(19[8-9]\d|20\d{2})(0[1-9]|1[0-2]|2[1-9]|3[0-2])([1-2])(\d{3})$/,
      "Invalid NIP"
    ),
  nama: z.string("Nama is required").max(50, "Nama must be at most 50 characters"),
});

const updateSchema = createSchema.partial();

router.get("/", authorizeScopes(["mutasi.pegawai.read"]), PegawaiMutasiControllerV1.getAll);
router.get("/Count", authorizeScopes(["mutasi.pegawai.read"]), PegawaiMutasiControllerV1.count);
router.get("/:id", authorizeScopes(["mutasi.pegawai.read"]), PegawaiMutasiControllerV1.getById);
router.post(
  "/",
  authorizeScopes(["mutasi.pegawai.write"]),
  validateBody(createSchema),
  PegawaiMutasiControllerV1.create
);
router.post(
  "/ImportCSV",
  authorizeScopes(["mutasi.pegawai.write"]),
  uploadCsvMemory,
  PegawaiMutasiControllerV1.import
);
router.post(
  "/:id/ResetData",
  authorizeScopes(["mutasi.pegawai.revoke"]),
  PegawaiMutasiControllerV1.reset
);
router.patch(
  "/:id",
  authorizeScopes(["mutasi.pegawai.update"]),
  validateBody(updateSchema),
  PegawaiMutasiControllerV1.update
);
router.delete("/:id", authorizeScopes(["mutasi.pegawai.delete"]), PegawaiMutasiControllerV1.delete);

router.use("/:PegawaiId/Keluarga", Keluarga);
router.use("/:PegawaiId/RincianBiaya", RincianBiaya);

export default router;
