import { Router } from "express";
import { getAllRincianBiaya } from "@/controllers/v1/rincianBiaya.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllRincianBiaya);

export default router;
