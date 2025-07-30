import { Router } from "express";
import {
  getAllKantor,
  getKantorById,
  createKantor,
  updateKantor,
  deleteKantor,
} from "@/controllers/v2/admin/referensi/kantor.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllKantor);
router.get("/:KodeSatker", getKantorById);
router.post("/", createKantor);
router.patch("/:KodeSatker", updateKantor);
router.delete("/:KodeSatker", deleteKantor);

export default router;
