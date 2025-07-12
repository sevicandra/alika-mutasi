import { Router } from "express";
import {
  getAllHistory,
  getHistoryById,
} from "@/controllers/v2/pegawai/riwayat.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllHistory);
router.get("/:historyId", getHistoryById);


export default router;
