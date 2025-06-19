import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan.route";
import PegawaiMutasi from "./PegawaiMutasi.route";
import Keluarga from "./Keluarga.route";
import RincianBiaya from "./RincianBiaya.route";
import Termin from "./Termin.route";


const router = Router({ mergeParams: true });
router.use("/", SuratKeputusan);
router.use("/:SkId/Pegawai", PegawaiMutasi);
router.use("/:SkId/Pegawai/:PegawaiId/Keluarga", Keluarga);
router.use("/:SkId/Pegawai/:PegawaiId/RincianBiaya", RincianBiaya);
router.use("/:SkId/Pegawai/:PegawaiId/Termin", Termin);

export default router;
