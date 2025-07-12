import { Router } from "express";
import {
  getAllTermin,
  getTerminById,
  createTermin,
  updateTermin,
  deleteTermin,
  resetTermin,
  getDokumen,
  getDokumenFile
} from "@/controllers/v2/sdm/termin.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllTermin);
router.get("/:TerminId", getTerminById);
router.post("/", createTermin);
router.post("/Reset", resetTermin);
router.patch("/:TerminId", updateTermin);
router.delete("/:TerminId", deleteTermin);
router.get("/:TerminId/Dokumen", getDokumen);
router.get("/:TerminId/Dokumen/:DokumenId/File", getDokumenFile);

export default router;
