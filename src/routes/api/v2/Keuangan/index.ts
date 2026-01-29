import { Router } from "express";
import Payroll from "./Payroll";
import PermohonanPembayaran from "./PermohonanPembayaran";
import SuratKeputusan from "./SuratKeputusan";

const router = Router({ mergeParams: true });

router.use("/SuratKeputusan", SuratKeputusan);
router.use("/PermohonanPembayaran", PermohonanPembayaran);
router.use("/Payroll", Payroll);

export default router;
