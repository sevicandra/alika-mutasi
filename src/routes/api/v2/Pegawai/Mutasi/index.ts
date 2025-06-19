import { Router } from "express";
import Mutasi from "./Mutasi.route";
import Keluarga from "./Keluarga.route"
import Biaya from "./Biaya.route"
import Sanggah from "./Sanggah.route"
import Pembayarab from "./Pembayaran.route";
import { authenticate } from "@/middlewares/auth.middleware";
const router = Router({ mergeParams: true });

router.use("/", authenticate(), Mutasi);
router.use("/:mutasiId/Keluarga", authenticate(), Keluarga);
router.use("/:mutasiId/Biaya", authenticate(), Biaya);
router.use("/:mutasiId/Sanggah", authenticate(), Sanggah);
router.use("/:mutasiId/Pembayaran", authenticate(), Pembayarab);


export default router;
