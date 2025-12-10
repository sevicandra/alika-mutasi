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
import { authenticate } from "@/middlewares/auth.middleware";
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

router.get("/", authenticate(["mutasi.suratKeputusan.read"]), getAllSuratKeputusan);
router.get("/Count", authenticate(["mutasi.suratKeputusan.read"]), countAllSuratKeputusan);
router.post("/", authenticate(["mutasi.suratKeputusan.write"]), upload.single("file"), createSuratKeputusan);
router.get("/:id", authenticate(["mutasi.suratKeputusan.read"]), getSuratKeputusanById);
router.patch("/:id", authenticate(["mutasi.suratKeputusan.update"]), upload.single("file"), updateSuratKeputusan);
router.delete("/:id", authenticate(["mutasi.suratKeputusan.delete"]), deleteSuratKeputusan);
router.get("/:id/File", authenticate(["mutasi.suratKeputusan.read"]), getSuratKeputusanFile);

router.post("/:id/ProcessKeluarga", authenticate(["mutasi.suratKeputusan.process"]), processKeluarga);
router.post("/:id/ProcessBiaya", authenticate(["mutasi.suratKeputusan.process"]), processBiaya);
router.use("/:SKId/Pegawai", authenticate(["mutasi.suratKeputusan.read"]), PegawaiMutasi);
export default router;
