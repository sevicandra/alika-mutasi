import { Router } from "express";
import { KantorControllerV2 } from "@/controllers/v2/admin/referensi/kantor.controller";

const router = Router();

router.get("/", KantorControllerV2.getAll);

export default router;
