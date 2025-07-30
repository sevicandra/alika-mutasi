import { Router } from "express";
import {
  getAllDarat,
  getDaratById,
  createDarat,
  updateDarat,
  deleteDarat,
} from "@/controllers/v2/admin/referensi/darat.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllDarat);
router.get("/:id", getDaratById);
router.post("/", createDarat);
router.patch("/:id", updateDarat);
router.delete("/:id", deleteDarat);

export default router;