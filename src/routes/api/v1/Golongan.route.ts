import { Router } from "express";
import {
    getAllGolongan,
    getGolonganById,
    createGolongan,
    updateGolongan,
    deleteGolongan,
} from "@/controllers/v1/golongan.controller";
const router = Router();

router.get("/", getAllGolongan);
router.get("/:id", getGolonganById);
router.post("/", createGolongan);
router.patch("/:id", updateGolongan);
router.delete("/:id", deleteGolongan);

export default router;