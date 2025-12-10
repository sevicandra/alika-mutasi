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
  processTermin,
  publishSuratKeputusan,
  setTimeline,
  getOverview,
  getOverviewCSV,
  batalSuratKeputusan,
  selesaiSuratKeputusan
} from "@/controllers/v2/sdm/suratKeputusan.controller";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
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
router.get("/:SkId", getSuratKeputusanById);
router.patch("/:SkId", upload.single("file"), updateSuratKeputusan);
router.delete("/:SkId", deleteSuratKeputusan);
router.get("/:SkId/File", getSuratKeputusanFile);

router.post("/:SkId/ProcessKeluarga", processKeluarga);
router.post("/:SkId/ProcessBiaya", processBiaya);
router.post("/:SkId/ProcessTermin", processTermin);
router.post("/:SkId/Publish", publishSuratKeputusan);
router.post("/:SkId/SetTimeline", setTimeline);
router.get("/:SkId/Overview", getOverview);
router.get("/:SkId/OverviewCSV", getOverviewCSV);
router.post("/:SkId/Batal", batalSuratKeputusan);
router.post("/:SkId/Selesai", selesaiSuratKeputusan);

export default router;
