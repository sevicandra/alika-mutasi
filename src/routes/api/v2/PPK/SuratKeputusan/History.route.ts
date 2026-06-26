import { Router } from "express";
import { riwayatController } from "@/controllers/v2/ppk/suratKeputusan/riwayat.controller";

const router = Router({ mergeParams: true });

router.get("/", riwayatController.getAll);
router.get("/:HistoryId", riwayatController.getById);

export default router;
