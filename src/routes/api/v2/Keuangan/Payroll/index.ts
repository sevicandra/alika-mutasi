import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan.route";
import Termin from "./Termin.route";
import Payroll from "./Payroll.route";


const router = Router({ mergeParams: true });
router.use("/", SuratKeputusan);
router.use("/:SkId/Termin", Termin);
router.use("/:SkId/Payroll", Payroll);


export default router;
