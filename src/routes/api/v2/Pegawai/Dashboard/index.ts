import { Router } from "express";
import {
  getStatus,
  getStatusDokumen,
  getBiaya,
  getHistory,
  getEstimasi,
  getFaq,
} from "@/controllers/v2/pegawai/dashboard.controller";
const router = Router({ mergeParams: true });

router.get("/Status", getStatus);
router.get("/Dokumen", getStatusDokumen);
router.get("/Biaya", getBiaya);
router.get("/Log", getHistory);
router.post("/Estimasi", getEstimasi);
router.get("/Faq", getFaq);

export default router;
