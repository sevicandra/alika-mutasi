import { Router } from "express";
import { SuratKeputusanController } from "@/controllers/v2/bendahara/suratKeputusan/suratKeputusan.controller";

const router = Router();

router.get("/", SuratKeputusanController.getAll);
router.get("/:SkId", SuratKeputusanController.getById);
router.get("/:SkId/File", SuratKeputusanController.getFile);
router.get("/:SkId/Overview", SuratKeputusanController.getOverview);
export default router;
