import { Router } from "express";
import { RincianBiayaControllerV2 } from "@/controllers/v2/sdm/addendumPembayaran/rincianBiaya.controller";

const router = Router({ mergeParams: true });

router.get("/", RincianBiayaControllerV2.getAll);
router.get("/:RincianBiayaId", RincianBiayaControllerV2.getById);
router.patch("/:RincianBiayaId", RincianBiayaControllerV2.update);

export default router;
