import { Router } from "express";
import {
  getAllGolongan,
  getGolonganById,
  createGolongan,
  updateGolongan,
  deleteGolongan,
} from "@/controllers/v2/admin/referensi/golongan.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllGolongan);
router.get("/:id", getGolonganById);
router.post("/", createGolongan);
router.patch("/:id", updateGolongan);
router.delete("/:id", deleteGolongan);

export default router;
