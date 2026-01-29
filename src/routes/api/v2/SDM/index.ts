import { Router } from "express";
import Pembayaran from "./PermohonanPembayaran";
import Sanggah from "./Sanggah";
import SuratKeputusan from "./SuratKeputusan";

// import Dashboard from "./Dashboard.route";

const router = Router({ mergeParams: true });
router.use("/SuratKeputusan", SuratKeputusan);
router.use("/Sanggah", Sanggah);
router.use("/PermohonanPembayaran", Pembayaran);
// router.use("/Dashboard", Dashboard);

export default router;
