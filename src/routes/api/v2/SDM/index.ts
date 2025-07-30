import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import Sanggah from "./Sanggah";
import Pembayaran from "./PermohonanPembayaran";


const router = Router({ mergeParams: true });
router.use("/SuratKeputusan", SuratKeputusan);
router.use("/Sanggah", Sanggah);
router.use("/PermohonanPembayaran", Pembayaran);

export default router;
