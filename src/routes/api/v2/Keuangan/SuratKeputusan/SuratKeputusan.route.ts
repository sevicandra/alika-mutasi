import { Router } from "express";
import { SuratKeputusanController } from "@/controllers/v2/keuangan/suratKeputusan/suratKeputusan.controller";
import { uploadCsvMemory } from "@/middlewares/multer.middleware";

const router = Router();

router.get("/", SuratKeputusanController.getAll);
router.get("/:SkId", SuratKeputusanController.getById);
router.get("/:SkId/File", SuratKeputusanController.getFile);
router.post("/:SkId/Payroll", uploadCsvMemory, SuratKeputusanController.importPayroll);
router.get("/:SkId/Overview", SuratKeputusanController.getOverview);
router.get("/:SkId/Overview-CSV", SuratKeputusanController.getOverviewCSV);
export default router;
