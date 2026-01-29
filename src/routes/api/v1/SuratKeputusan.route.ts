import { Router } from "express";
import z from "zod";
import { SuratKeputusanControllerV1 } from "@/controllers/v1/suratKeputusan.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";
import { uploadPdfDisk, uploadPdfDiskOptional } from "@/middlewares/multer.middleware";
import { validateBody } from "@/middlewares/validate-request.middleware";
import PegawaiMutasi from "./PegawaiMutasi.route";

const router = Router();

const createSchema = z.object({
  nomor: z.string("Nomor is required").max(100, "Nomor must be at most 100 characters"),
  uraian: z.string("Uraian is required").max(255, "Uraian must be at most 255 characters"),
  tanggal: z
    .string("Tanggal is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal must be in YYYY-MM-DD format"),
  tmt: z.string("TMT is required").regex(/^\d{4}-\d{2}-\d{2}$/, "TMT must be in YYYY-MM-DD format"),
  jenjang: z.enum([
    "ESELON I",
    "ESELON II",
    "ESELON III",
    "ESELON IV",
    "JABATAN FUNGSIONAL",
    "PELAKSANA",
    "PENSIUN",
  ]),
});

const updateSchema = createSchema.partial();


router.get("/", authorizeScopes(["mutasi.suratKeputusan.read"]), SuratKeputusanControllerV1.getAll);
router.get(
  "/Count",
  authorizeScopes(["mutasi.suratKeputusan.read"]),
  SuratKeputusanControllerV1.count
);
router.post(
  "/",
  authorizeScopes(["mutasi.suratKeputusan.write"]),
  uploadPdfDisk,
  validateBody(createSchema),
  SuratKeputusanControllerV1.create
);
router.get(
  "/:id",
  authorizeScopes(["mutasi.suratKeputusan.read"]),
  SuratKeputusanControllerV1.getById
);
router.patch(
  "/:id",
  authorizeScopes(["mutasi.suratKeputusan.update"]),
  uploadPdfDiskOptional,
  validateBody(updateSchema),
  SuratKeputusanControllerV1.update
);
router.delete(
  "/:id",
  authorizeScopes(["mutasi.suratKeputusan.delete"]),
  SuratKeputusanControllerV1.delete
);
router.get(
  "/:id/File",
  authorizeScopes(["mutasi.suratKeputusan.read"]),
  SuratKeputusanControllerV1.getFile
);
router.post(
  "/:id/ProcessKeluarga",
  authorizeScopes(["mutasi.suratKeputusan.process"]),
  SuratKeputusanControllerV1.processKeluarga
);
router.post(
  "/:id/ProcessBiaya",
  authorizeScopes(["mutasi.suratKeputusan.process"]),
  SuratKeputusanControllerV1.hitungBiaya
);
router.post(
  "/:id/ProcessTermin",
  authorizeScopes(["mutasi.suratKeputusan.process"]),
  SuratKeputusanControllerV1.processTermin
);
router.use("/:SKId/Pegawai", authorizeScopes(["mutasi.suratKeputusan.read"]), PegawaiMutasi);
export default router;
