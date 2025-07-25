import { Router } from "express";
import {
  getAllPermohonan,
  getPermohonanById,
  setujuiPermohonan,
  tolakPermohonan,
  getDokumenFile,
} from "@/controllers/v2/keuangan/permohonanPembayaran.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllPermohonan);
router.get("/:PermohonanId", getPermohonanById);
router.get("/:PermohonanId/Dokumen/:DokumenId/File", getDokumenFile);
router.post("/:PermohonanId/Setuju", setujuiPermohonan);
router.post("/:PermohonanId/Tolak", tolakPermohonan);

export default router;
