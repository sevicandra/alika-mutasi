import { Router } from "express";
import { MutasiControllerV2 } from "@/controllers/v2/pegawai/mutasi.controller";

const router = Router({ mergeParams: true });

router.get("/", MutasiControllerV2.getAll);
router.get("/:mutasiId", MutasiControllerV2.getById);
router.get("/:mutasiId/Timeline", MutasiControllerV2.getTimeline);
router.post("/:mutasiId/Approve", MutasiControllerV2.approve);


export default router;
