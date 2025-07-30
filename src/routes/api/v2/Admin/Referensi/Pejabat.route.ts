import { Router } from "express";
import {
  getAllPejabat,
  getPejabatById,
  createPejabat,
  updatePejabat,
  deletePejabat,
} from "@/controllers/v2/admin/referensi/pejabat.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllPejabat);
router.get("/:id", getPejabatById);
router.post("/", createPejabat);
router.patch("/:id", updatePejabat);
router.delete("/:id", deletePejabat);

export default router;
