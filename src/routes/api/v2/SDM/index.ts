import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan";
import Sanggah from "./Sanggah";
import Pembayaran from "./PermohonanPembayaran";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router({ mergeParams: true });
router.use("/SuratKeputusan", authenticate(), SuratKeputusan);
router.use("/Sanggah", authenticate(), Sanggah);
router.use("/PermohonanPembayaran", authenticate(), Pembayaran);

export default router;
