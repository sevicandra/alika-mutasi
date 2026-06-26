import { Router } from "express";
import { terminController } from "@/controllers/v2/bendahara/suratKeputusan/termin.controller";

const router = Router({ mergeParams: true });

router.get("/", terminController.getAll);
router.get("/:TerminId", terminController.getById);

export default router;
