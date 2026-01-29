import { Router } from "express";
import { RincianBiayaControllerV2 } from "@/controllers/v2/pegawai/biaya.controller";

const router = Router({ mergeParams: true });

router.get("/", RincianBiayaControllerV2.getAll);
export default router;
