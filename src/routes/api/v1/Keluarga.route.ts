import {Router} from "express";
import {
    getAllKeluarga,
    getKeluargaById,
    createKeluarga,
    updateKeluarga,
    deleteKeluarga,
} from "@/controllers/v1/Keluarga.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllKeluarga);
router.get("/:id", getKeluargaById);
router.post("/", createKeluarga);
router.patch("/:id", updateKeluarga);
router.delete("/:id", deleteKeluarga);


export default router;