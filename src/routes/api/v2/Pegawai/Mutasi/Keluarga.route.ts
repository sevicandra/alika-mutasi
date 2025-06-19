import { Router } from "express";
import {
    getAllKeluarga
} from "@/controllers/v2/pegawai/keluarga.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllKeluarga);

export default router;