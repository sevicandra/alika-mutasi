import { Router } from "express";
import Mutasi from "./Mutasi.route";
import Keluarga from "./Keluarga.route";
import Biaya from "./Biaya.route";
import Sanggah from "./Sanggah.route";
import Pembayaran from "./Pembayaran.route";
import History from "./History.route";
import { authenticate } from "@/middlewares/auth.middleware";
const router = Router({ mergeParams: true });

router.use("/", authenticate(), Mutasi);
router.use("/:mutasiId/Keluarga", authenticate(), Keluarga);
router.use("/:mutasiId/Biaya", authenticate(), Biaya);
router.use("/:mutasiId/Sanggah", authenticate(), Sanggah);
router.use("/:mutasiId/Pembayaran", authenticate(), Pembayaran);
router.use("/:mutasiId/History", authenticate(), History);

export default router;
