import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import PermohonanPembayaran from "./PermohonanPembayaran";
import  Payroll  from "./Payroll";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.use("/SuratKeputusan", authenticate(), SuratKeputusan);
router.use("/PermohonanPembayaran", authenticate(), PermohonanPembayaran);
router.use("/Payroll", authenticate(), Payroll);


export default router;
