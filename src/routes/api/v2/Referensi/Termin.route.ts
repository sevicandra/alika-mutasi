import { Router } from "express";
import { TerminControllerV2 } from "@/controllers/v2/admin/referensi/termin.controller";

const router = Router();

router.get("/", TerminControllerV2.getAll);
router.get("/:id", TerminControllerV2.getById);
export default router;
