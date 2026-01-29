import { Router } from "express";
import { DokumenTerminControllerV2 } from "@/controllers/v2/sdm/dokumen.controller";

const router = Router({ mergeParams: true });

router.get("/:dokumenId/File", DokumenTerminControllerV2.getFile);

export default router;
