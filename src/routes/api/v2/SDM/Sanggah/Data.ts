import { Router } from "express";
import { DataSanggahControllerV2 } from "@/controllers/v2/sdm/dataSanggah.controller";

const router = Router({ mergeParams: true });
router.get("/", DataSanggahControllerV2.getAll);
router.get("/:DataId/File", DataSanggahControllerV2.getFile);

export default router;
