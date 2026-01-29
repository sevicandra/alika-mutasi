import { Router } from "express";
import { RiwayatControllerV2 } from "@/controllers/v2/pegawai/riwayat.controller";

const router = Router({ mergeParams: true });

router.get("/", RiwayatControllerV2.getAll);
router.get("/:historyId", RiwayatControllerV2.getById);

export default router;
