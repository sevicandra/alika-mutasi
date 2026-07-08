import { Router } from "express";
import z from "zod";
import { PegawaiMutasiControllerV2 } from "@/controllers/v2/sdm/pagawaiMutasi.controller";
import { uploadCsvMemory } from "@/middlewares/multer.middleware";
import { validateBody, validateCsvMiddleware } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });
const createSchema = z.object({
  golongan: z
    .string("Golongan is Required")
    .max(2, "Golongan must be at most 2 characters")
    .min(1, "Golongan is Required"),
  kantor_asal: z
    .string("Kantor Asal is Required")
    .regex(/^\d{6}$/, "Kantor asal must be exactly 6 digits")
    .min(1, "Kantor Asal is Required"),
  kantor_tujuan: z
    .string("Kantor Tujuan is Required")
    .regex(/^\d{6}$/, "Kantor tujuan must be exactly 6 digits")
    .min(1, "Kantor Tujuan is Required"),
  nip: z
    .string("NIP is required")
    .regex(
      /^(19[6-9]\d|20\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2]\d|3[0-1])(19[8-9]\d|20\d{2})(0[1-9]|1[0-2]|2[1-9]|3[0-2])([1-2])(\d{3})$/,
      "Invalid NIP"
    )
    .min(1, "NIP is required"),
  nama: z
    .string("Nama is Required")
    .max(50, "Nama must be at most 50 characters")
    .min(1, "Nama is Required"),
});

const updateSchema = createSchema.partial();

router.get("/", PegawaiMutasiControllerV2.getAll);
router.get("/Count", PegawaiMutasiControllerV2.count);
router.get("/:PegawaiId", PegawaiMutasiControllerV2.getById);
router.post("/", validateBody(createSchema), PegawaiMutasiControllerV2.create);
router.post(
  "/ImportCSV",
  uploadCsvMemory,
  validateCsvMiddleware(createSchema),
  PegawaiMutasiControllerV2.import
);
router.post("/:PegawaiId/ResetData", PegawaiMutasiControllerV2.reset);
router.patch("/:PegawaiId", validateBody(updateSchema), PegawaiMutasiControllerV2.update);
router.delete("/:PegawaiId", PegawaiMutasiControllerV2.delete);
router.post("/:PegawaiId/Hitung", PegawaiMutasiControllerV2.hitung);

export default router;
