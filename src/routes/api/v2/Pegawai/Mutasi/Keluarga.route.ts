import { Router } from "express";
import { KeluargaControllerV2 } from "@/controllers/v2/pegawai/keluarga.controller";

const router = Router({ mergeParams: true });

router.get("/", KeluargaControllerV2.getAll);

export default router;
