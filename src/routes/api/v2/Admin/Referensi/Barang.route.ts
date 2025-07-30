import { Router } from "express";
import {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
} from "@/controllers/v2/admin/referensi/barang.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllBarang);
router.get("/:id", getBarangById);
router.post("/", createBarang);
router.patch("/:id", updateBarang);
router.delete("/:id", deleteBarang);

export default router;