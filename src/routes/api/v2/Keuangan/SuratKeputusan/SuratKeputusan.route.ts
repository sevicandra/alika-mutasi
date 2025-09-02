import { Router } from "express";
import {
  getAllSuratKeputusan,
  getSuratKeputusanById,
  getSuratKeputusanFile,
  importPayroll,
  getOverview,
} from "@/controllers/v2/keuangan/suratKeputusan/suratKeputusan.controller";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".csv")) {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", getAllSuratKeputusan);
router.get("/:SkId", getSuratKeputusanById);
router.get("/:SkId/File", getSuratKeputusanFile);
router.post("/:SkId/Payroll", upload.single("file"), importPayroll);
router.get("/:SkId/Overview", getOverview);

export default router;
