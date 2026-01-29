import { Router } from "express";
import Biaya from "./Biaya.route";
import History from "./History.route";
import Keluarga from "./Keluarga.route";
import Mutasi from "./Mutasi.route";
import Pembayaran from "./Pembayaran.route";
import Sanggah from "./Sanggah.route";

const router = Router({ mergeParams: true });

router.use("/", Mutasi);
router.use("/:mutasiId/Keluarga", Keluarga);
router.use("/:mutasiId/Biaya", Biaya);
router.use("/:mutasiId/Sanggah", Sanggah);
router.use("/:mutasiId/Pembayaran", Pembayaran);
router.use("/:mutasiId/History", History);

export default router;
