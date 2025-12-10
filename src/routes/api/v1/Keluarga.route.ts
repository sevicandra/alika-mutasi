import {Router} from "express";
import {
    getAllKeluarga,
    getKeluargaById,
    createKeluarga,
    updateKeluarga,
    deleteKeluarga,
} from "@/controllers/v1/Keluarga.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/", authenticate(["mutasi.keluarga.read"]), getAllKeluarga);
router.get("/:id", authenticate(["mutasi.keluarga.read"]), getKeluargaById);
router.post("/", authenticate(["mutasi.keluarga.write"]), createKeluarga);
router.patch("/:id", authenticate(["mutasi.keluarga.update"]), updateKeluarga);
router.delete("/:id", authenticate(["mutasi.keluarga.delete"]), deleteKeluarga);

export default router;