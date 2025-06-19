import { Router } from "express";
import {
  getAllSuratKeputusan,
  createSuratKeputusan,
  getSuratKeputusanById,
  updateSuratKeputusan,
  deleteSuratKeputusan,
  countAllSuratKeputusan,
  getSuratKeputusanFile,
  processKeluarga,
  processBiaya,
} from "@/controllers/v1/suratKeputusan.controller";
import PegawaiMutasi from "./PegawaiMutasi.route";
import multer from "multer";
const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // maksimal 50MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".pdf")) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", getAllSuratKeputusan);
router.get("/Count", countAllSuratKeputusan);
router.post("/", upload.single("file"), createSuratKeputusan);
router.get("/:id", getSuratKeputusanById);
router.patch("/:id", upload.single("file"), updateSuratKeputusan);
router.delete("/:id", deleteSuratKeputusan);
router.get("/:id/File", getSuratKeputusanFile);

router.post("/:id/ProcessKeluarga", processKeluarga);
router.post("/:id/ProcessBiaya", processBiaya);

router.use("/:SKId/Pegawai", PegawaiMutasi);

export default router;
