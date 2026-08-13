import { Router } from "express";
import { TerminControllerV2 } from "@/controllers/v2/sdm/addendumPembayaran/termin.controller";

const router = Router({ mergeParams: true });

router.get("/", TerminControllerV2.getAll);
router.get("/:TerminId", TerminControllerV2.getById);
router.post("/", TerminControllerV2.create);

export default router;
