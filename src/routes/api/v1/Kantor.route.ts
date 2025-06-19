import { Router } from "express";
import {
  getAllKantor,
  getKantorById,
  createKantor,
  updateKantor,
  deleteKantor,
} from "@/controllers/v1/kantor.controller";

const router = Router();

router.get("/", getAllKantor);
router.get("/:id", getKantorById);
router.post("/", createKantor);
router.patch("/:id", updateKantor);
router.delete("/:id", deleteKantor);

export default router;
