import { Router } from "express";
import {
  getAllKantor,
  getKantorById,
  createKantor,
  updateKantor,
  deleteKantor,
} from "@/controllers/v1/kantor.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate(["mutasi.kantor.read"]), getAllKantor);
router.get("/:id", authenticate(["mutasi.kantor.read"]), getKantorById);
router.post("/", authenticate(["mutasi.kantor.write"]), createKantor);
router.patch("/:id", authenticate(["mutasi.kantor.update"]), updateKantor);
router.delete("/:id", authenticate(["mutasi.kantor.delete"]), deleteKantor);
export default router;
