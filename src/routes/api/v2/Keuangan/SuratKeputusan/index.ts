import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan.route";
import PegawaiMutasi from "./PegawaiMutasi.route";
import Keluarga from "./Keluarga.route";
import Termin from "./Termin.route";
import History from "./History.route"
import Dokumen from "./Dokumen.route";



const router = Router({ mergeParams: true });
router.use("/", SuratKeputusan);
router.use("/:SkId/Pegawai", PegawaiMutasi);
router.use("/:SkId/Pegawai/:PegawaiId/Keluarga", Keluarga);
router.use("/:SkId/Pegawai/:PegawaiId/Termin", Termin);
router.use("/:SkId/Pegawai/:PegawaiId/History", History);
router.use("/:SkId/Pegawai/:PegawaiId/Termin/:TerminId/Dokumen", Dokumen);


export default router;
