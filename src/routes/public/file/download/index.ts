import { Router } from "express";
import {pembayaran} from "@/controllers/public/download.controller"

const router = Router();

router.use("/:id", pembayaran);


export default router;
