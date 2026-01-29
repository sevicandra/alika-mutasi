import { Router } from "express";
import { GolonganControllerV2 } from "@/controllers/v2/admin/referensi/golongan.controller";

const router = Router();

router.get("/", GolonganControllerV2.getAll);
export default router;
