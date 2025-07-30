import { Router } from "express";
import {
  getAllKapal,
  getKapalById,
  createKapal,
  updateKapal,
  deleteKapal,
} from "@/controllers/v2/admin/referensi/kapal.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllKapal);
router.get("/:id", getKapalById);
router.post("/", createKapal);
router.patch("/:id", updateKapal);
router.delete("/:id", deleteKapal);

export default router;