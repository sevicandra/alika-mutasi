import { Router } from "express";
import { getAllSanggah, getSanggahById, reviewSanggah } from "@/controllers/v2/sdm/sanggah.controller";
import Data from "./Data";

const router = Router({ mergeParams: true });

router.get("/", getAllSanggah);
router.get("/:SanggahId", getSanggahById);
router.post("/:SanggahId/Review", reviewSanggah);

router.use("/:SanggahId/Data", Data);

export default router;
