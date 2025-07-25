import { Router } from "express";
import {
  getAllKeluarga,
  getKeluargaById,

  getFileKeluarga
} from "@/controllers/v2/keuangan/suratKeputusan/keluarga.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllKeluarga);
router.get("/:KeluargaId", getKeluargaById);
router.get("/:KeluargaId/File", getFileKeluarga);


export default router;
