import { Router } from "express";
import {
  getAllKeluarga,
  getKeluargaById,
  createKeluarga,
  updateKeluarga,
  deleteKeluarga,
  getFileKeluarga
} from "@/controllers/v2/sdm/keluarga.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllKeluarga);
router.get("/:KeluargaId", getKeluargaById);
router.post("/", createKeluarga);
router.patch("/:KeluargaId", updateKeluarga);
router.delete("/:KeluargaId", deleteKeluarga);
router.get("/:KeluargaId/File", getFileKeluarga);


export default router;
