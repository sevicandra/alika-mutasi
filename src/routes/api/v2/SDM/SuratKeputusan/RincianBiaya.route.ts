import { Router } from "express";
import {
  getAllRincianBiaya,
  getRincianBiayaById,
  createRincianBiaya,
  updateRincianBiaya,
  deleteRincianBiaya,
  resetRincianBiaya,
} from "@/controllers/v2/sdm/rincianBiaya.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllRincianBiaya);
router.get("/:RincianBiayaId", getRincianBiayaById);
router.post("/", createRincianBiaya);
router.post("/Reset", resetRincianBiaya);
router.patch("/:RincianBiayaId", updateRincianBiaya);
router.delete("/:RincianBiayaId", deleteRincianBiaya);

export default router;
