import { Router } from "express";
import { HubunganKeluargaControllerV2 } from "@/controllers/v2/admin/referensi/hubunganKeluarga.controller";

const router = Router();

router.get("/", HubunganKeluargaControllerV2.getAll);
export default router;
