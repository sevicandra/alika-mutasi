import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import Sanggah from "./Sanggah";
import Pembayaran from "./PermohonanPembayaran";
import Dashboard from "./Dashboard.route";

const router = Router({ mergeParams: true });
router.use("/SuratKeputusan", SuratKeputusan);
router.use("/Sanggah", Sanggah);
router.use("/PermohonanPembayaran", Pembayaran);
router.use("/Dashboard", Dashboard);

export default router;
