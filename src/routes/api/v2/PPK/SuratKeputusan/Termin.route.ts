import { Router } from "express";
import { terminController } from "@/controllers/v2/ppk/suratKeputusan/termin.controller";

const router = Router({ mergeParams: true });

router.get("/", terminController.getAll);
router.get("/:TerminId", terminController.getById);

export default router;
