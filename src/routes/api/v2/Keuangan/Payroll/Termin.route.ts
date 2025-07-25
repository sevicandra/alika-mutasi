import { Router } from "express";
import {
  getAllTermin,
  tolakTermin,
  getRekening,
  updateRekening,
} from "@/controllers/v2/keuangan/payroll/termin.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllTermin);
router.post("/:TerminId/Tolak", tolakTermin);
router.get("/:TerminId/Rekening", getRekening);
router.patch("/:TerminId/Rekening", updateRekening);

export default router;
