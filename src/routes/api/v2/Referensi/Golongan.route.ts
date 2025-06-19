import { Router } from "express";
import { getAllGolongan } from "@/controllers/v2/referensi/Golongan.controller";

const router = Router();

router.get("/", getAllGolongan);

export default router;
