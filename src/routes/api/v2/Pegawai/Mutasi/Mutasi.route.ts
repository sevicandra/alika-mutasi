import { Router } from "express";
import {
  getAllMutasi,
  getTimeline,
  getMutasiById,
  approve,
} from "@/controllers/v2/pegawai/mutasi.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllMutasi);
router.get("/:mutasiId", getMutasiById);
router.get("/:mutasiId/Timeline", getTimeline);
router.post("/:mutasiId/Approve", approve);

export default router;
