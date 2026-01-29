import { Router } from "express";
import { downlaodFile } from "@/controllers/public/download.controller";

const router = Router();

router.use("/:id", downlaodFile);

export default router;
