import { Router } from "express";
import Mutasi from "./Mutasi";
import { authenticate } from "@/middlewares/auth.middleware";
const router = Router({ mergeParams: true });

router.use("/Mutasi", authenticate(), Mutasi);

export default router;
