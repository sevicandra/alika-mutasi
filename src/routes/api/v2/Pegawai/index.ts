import { Router } from "express";
import Mutasi from "./Mutasi";
import Tte from "./TTE";
import { authenticate } from "@/middlewares/auth.middleware";
const router = Router({ mergeParams: true });

router.use("/Mutasi", authenticate(), Mutasi);
router.use("/TTE", authenticate(), Tte);

export default router;
