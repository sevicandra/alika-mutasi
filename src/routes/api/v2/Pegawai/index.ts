import { Router } from "express";
import Mutasi from "./Mutasi";
import Tte from "./TTE";
const router = Router({ mergeParams: true });

router.use("/Mutasi", Mutasi);
router.use("/TTE", Tte);

export default router;
