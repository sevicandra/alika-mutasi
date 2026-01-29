import { Router } from "express";
import { SanggahControllerV2 } from "@/controllers/v2/sdm/sanggah.controller";
import Data from "./Data";

const router = Router({ mergeParams: true });

router.get("/", SanggahControllerV2.getAll);
router.get("/:SanggahId", SanggahControllerV2.getById);
router.post("/:SanggahId/Review", SanggahControllerV2.review);

router.use("/:SanggahId/Data", Data);

export default router;
