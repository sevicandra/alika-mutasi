import { Router } from "express";
import Mutasi from "./Mutasi";
import Tte from "./TTE";
import Dashboard from "./Dashboard";
const router = Router({ mergeParams: true });

router.use("/Mutasi", Mutasi);
router.use("/TTE", Tte);
router.use("/Dashboard", Dashboard);

export default router;
