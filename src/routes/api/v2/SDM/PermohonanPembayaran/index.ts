import { Router } from "express";
import {
  getAllPermohonan,
  getPermohonanById,
  setujuiPermohonan,
  tolakPermohonan,
} from "@/controllers/v2/sdm/permohonanPembayaran.controller";
import Dokumen from "./Dokumen.route"

const router = Router({ mergeParams: true });

router.get("/", getAllPermohonan);
router.get("/:permohonanId", getPermohonanById);
router.use("/:permohonanId/Dokumen", Dokumen);
router.post("/:permohonanId/Setuju", setujuiPermohonan);
router.post("/:permohonanId/Tolak", tolakPermohonan);

export default router;
