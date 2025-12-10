import { Router } from "express";
import { getAllRincianBiaya } from "@/controllers/v1/rincianBiaya.controller";
import { authenticate } from "@/middlewares/auth.middleware";
const router = Router({ mergeParams: true });

router.get("/", authenticate(["mutasi.rincianBiaya.read"]), getAllRincianBiaya);

export default router;
