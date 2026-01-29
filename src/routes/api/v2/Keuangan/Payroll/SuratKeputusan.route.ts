import { Router } from "express";
import { SuratKeputusanController } from "@/controllers/v2/keuangan/payroll/suratKeputusan.controller";

const router = Router();

router.get("/", SuratKeputusanController.getAll);
router.get("/:SkId", SuratKeputusanController.getById);
router.post("/:SkId/Download", SuratKeputusanController.download);

export default router;
