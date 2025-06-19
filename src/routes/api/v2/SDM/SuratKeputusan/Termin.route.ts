import { Router } from "express";
import {
  getAllTermin,
  getTerminById,
  createTermin,
  updateTermin,
  deleteTermin,
  resetTermin,
} from "@/controllers/v2/sdm/termin.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllTermin);
router.get("/:TerminId", getTerminById);
router.post("/", createTermin);
router.post("/Reset", resetTermin);
router.patch("/:TerminId", updateTermin);
router.delete("/:TerminId", deleteTermin);

export default router;
