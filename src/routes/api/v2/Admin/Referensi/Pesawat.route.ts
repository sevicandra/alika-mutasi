import { Router } from "express";
import {
  getAllPesawat,
  getPesawatById,
  createPesawat,
  updatePesawat,
  deletePesawat,
} from "@/controllers/v2/admin/referensi/pesawat.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllPesawat);
router.get("/:id", getPesawatById);
router.post("/", createPesawat);
router.patch("/:id", updatePesawat);
router.delete("/:id", deletePesawat);

export default router;
