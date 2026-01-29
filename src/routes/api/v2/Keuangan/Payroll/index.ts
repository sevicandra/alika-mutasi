import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan.route";
import Termin from "./Termin.route";

const router = Router({ mergeParams: true });
router.use("/", SuratKeputusan);
router.use("/:SkId/Termin", Termin);

export default router;
