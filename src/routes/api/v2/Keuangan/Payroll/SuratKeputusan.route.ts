import { Router } from "express";
import {
  getAllSuratKeputusan,
  getSuratKeputusanById,
  downloadPayroll,
} from "@/controllers/v2/keuangan/payroll/suratKeputusan.controller";

const router = Router();

router.get("/", getAllSuratKeputusan);
router.get("/:SkId", getSuratKeputusanById);
router.post("/:SkId/Download", downloadPayroll);

export default router;
