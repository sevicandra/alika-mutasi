import { Router } from "express";
import { TerminController } from "@/controllers/v2/admin/referensi/termin.controller";

const router = Router();

router.get("/", TerminController.getAll);
router.get("/:id", TerminController.getById);
export default router;
