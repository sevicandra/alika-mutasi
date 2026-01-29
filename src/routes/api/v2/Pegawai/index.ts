import { Router } from "express";
import Dashboard from "./Dashboard";
import Mutasi from "./Mutasi";
import Tte from "./TTE";

const router = Router({ mergeParams: true });

router.use("/Mutasi", Mutasi);
router.use("/TTE", Tte);
router.use("/Dashboard", Dashboard);

export default router;
