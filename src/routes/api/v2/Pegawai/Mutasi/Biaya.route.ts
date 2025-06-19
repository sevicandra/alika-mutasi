import { Router } from "express";
import {
    getAllRincianBiaya
} from "@/controllers/v2/pegawai/biaya.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllRincianBiaya);

export default router;