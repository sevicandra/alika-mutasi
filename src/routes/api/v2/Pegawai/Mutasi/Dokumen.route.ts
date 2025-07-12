import { Router } from "express";
import multer from "multer";
import {
  getAllDokumen,
  tteDokumen,
  getDokumenFile,
  uploadDokumen,
  deleteDokumen,
  setTtePejabatKantorAsal,
  setTtePejabatKantorTujuan,
  cekStatusSPD2,
  resetTtePejabatKantorAsal,
  resetTtePejabatKantorTujuan,
} from "@/controllers/v2/pegawai/dokumen.controller";
const router = Router({ mergeParams: true });
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

router.get("/", getAllDokumen);
router.post("/:dokumenId", tteDokumen);
router.get("/:dokumenId/File", getDokumenFile);
router.post("/:dokumenId/File", upload.single("file"), uploadDokumen);
router.delete("/:dokumenId/File", deleteDokumen);
router.get("/:dokumenId/SPD2/Status", cekStatusSPD2);
router.post("/:dokumenId/SPD2/KantorAsal", setTtePejabatKantorAsal);
router.post("/:dokumenId/SPD2/KantorTujuan", setTtePejabatKantorTujuan);
router.delete("/:dokumenId/SPD2/KantorAsal", resetTtePejabatKantorAsal);
router.delete("/:dokumenId/SPD2/KantorTujuan", resetTtePejabatKantorTujuan);

export default router;
