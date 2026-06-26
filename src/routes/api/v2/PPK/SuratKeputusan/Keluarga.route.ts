import { Router } from "express";
import { KeluargaController } from "@/controllers/v2/ppk/suratKeputusan/keluarga.controller";

const router = Router({ mergeParams: true });

router.get("/", KeluargaController.getAll);
router.get("/:KeluargaId", KeluargaController.getById);
router.get("/:KeluargaId/File", KeluargaController.getFile);

export default router;
