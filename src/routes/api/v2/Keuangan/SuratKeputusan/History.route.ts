import { Router } from "express";
import {
  getAllHistory,
  getHistoryById,
} from "@/controllers/v2/keuangan/suratKeputusan/riwayat.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllHistory);
router.get("/:HistoryId", getHistoryById);

export default router;
