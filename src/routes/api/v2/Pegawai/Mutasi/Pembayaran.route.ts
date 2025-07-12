import { Router } from "express";
import {
  getAllTermin,
  getTerminById,
  kirimTermin
} from "@/controllers/v2/pegawai/pembayaran.controller";
import Dokumen from "./Dokumen.route"
const router = Router({ mergeParams: true });

router.get("/", getAllTermin);
router.get("/:terminId", getTerminById);
router.use("/:terminId/Dokumen", Dokumen);
router.post("/:terminId/Kirim", kirimTermin);



export default router;