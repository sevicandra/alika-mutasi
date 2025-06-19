import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import Sanggah from "./Sanggah";

const router = Router({ mergeParams: true });
router.use("/SuratKeputusan", SuratKeputusan);
router.use("/Sanggah", Sanggah);

export default router;
