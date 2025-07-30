import { Router } from "express";
import {
  getAllTarif,
  getTarifById,
  createTarif,
  updateTarif,
  deleteTarif,
} from "@/controllers/v2/admin/referensi/tarif.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllTarif);
router.get("/:id", getTarifById);
router.post("/", createTarif);
router.patch("/:id", updateTarif);
router.delete("/:id", deleteTarif);

export default router;
