import { Router } from "express";
import {
  getAllGolongan,
  getGolonganById,
  createGolongan,
  updateGolongan,
  deleteGolongan,
} from "@/controllers/v1/golongan.controller";
import { authenticate } from "@/middlewares/auth.middleware";
const router = Router();

router.get("/", authenticate(["mutasi.golongan.read"]), getAllGolongan);
router.get("/:id", authenticate(["mutasi.golongan.read"]), getGolonganById);
router.post("/", authenticate(["mutasi.golongan.write"]), createGolongan);
router.patch("/:id", authenticate(["mutasi.golongan.update"]), updateGolongan);
router.delete("/:id", authenticate(["mutasi.golongan.delete"]), deleteGolongan);

export default router;
