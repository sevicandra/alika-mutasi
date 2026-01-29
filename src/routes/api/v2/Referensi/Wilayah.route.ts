import { Router } from "express";
import { ProvinsiControllerV2 } from "@/controllers/v2/admin/referensi/provinsi.controller";

const router = Router();

router.get("/", ProvinsiControllerV2.getAll);
router.get("/:KodeProv", ProvinsiControllerV2.getKotas);

export default router;
