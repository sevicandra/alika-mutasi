import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import PermohonanPembayaran from "./PermohonanPembayaran";
import  Payroll  from "./Payroll";

const router = Router({ mergeParams: true });

router.use("/SuratKeputusan", SuratKeputusan);
router.use("/PermohonanPembayaran", PermohonanPembayaran);
router.use("/Payroll", Payroll);


export default router;
