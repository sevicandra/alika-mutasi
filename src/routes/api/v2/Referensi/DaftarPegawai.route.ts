import { Router } from "express";
import { DaftarPegawaiControllerV2 } from "@/controllers/v2/referensi/DaftarPegawai.controller";

const router = Router();

router.get("/", DaftarPegawaiControllerV2.hrisv1);

export default router;
