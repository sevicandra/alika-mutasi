import { Router } from "express";
import {
  getAllTte,
  getFileTte,
  getTteById,
  processTte,
  tolakTte,
} from "@/controllers/v2/pegawai/tte.controller";


const router = Router({ mergeParams: true });

router.get("/", getAllTte);
router.get("/:id", getTteById);
router.get("/:id/File", getFileTte);
router.post("/:id/Process", processTte);
router.post("/:id/Tolak", tolakTte);

export default router;