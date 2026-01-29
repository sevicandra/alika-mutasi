import { Router } from "express";
import { RiwayatControllerV2 } from "@/controllers/v2/sdm/riwayat.controller";

const router = Router({ mergeParams: true });

router.get("/", RiwayatControllerV2.getAll);
router.get("/:HistoryId", RiwayatControllerV2.getById);

export default router;
