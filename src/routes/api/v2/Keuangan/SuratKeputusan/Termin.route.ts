import { Router } from "express";
import {
  getAllTermin,
  getTerminById,
} from "@/controllers/v2/keuangan/suratKeputusan/termin.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllTermin);
router.get("/:TerminId", getTerminById);

export default router;
