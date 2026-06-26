import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import TTE from "./TTE";

const router = Router({ mergeParams: true });

router.use("/SuratKeputusan", SuratKeputusan);
router.use("/TTE", TTE);

export default router;
