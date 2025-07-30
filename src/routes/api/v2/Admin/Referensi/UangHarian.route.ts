import { Router } from "express";
import {
  getAllUangHarian,
  getUangHarianById,
  createUangHarian,
  updateUangHarian,
  deleteUangHarian,
} from "@/controllers/v2/admin/referensi/uangHarian.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllUangHarian);
router.get("/:id", getUangHarianById);
router.post("/", createUangHarian);
router.patch("/:id", updateUangHarian);
router.delete("/:id", deleteUangHarian);

export default router;
