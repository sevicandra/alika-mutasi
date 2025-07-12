import { Router } from "express";
import { getAllPegawai } from "@/controllers/v2/referensi/DaftarPegawai.controller";

const router = Router();

router.get("/", getAllPegawai);

export default router;
