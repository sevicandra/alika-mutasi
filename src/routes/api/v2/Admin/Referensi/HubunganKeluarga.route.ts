import { Router } from "express";
import {
  getAllHubunganKeluarga,
  getHubunganKeluargaById,
  createHubunganKeluarga,
  updateHubunganKeluarga,
  deleteHubunganKeluarga,
} from "@/controllers/v2/admin/referensi/hubunganKeluarga.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllHubunganKeluarga);
router.get("/:id", getHubunganKeluargaById);
router.post("/", createHubunganKeluarga);
router.patch("/:id", updateHubunganKeluarga);
router.delete("/:id", deleteHubunganKeluarga);

export default router;
