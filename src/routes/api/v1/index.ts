import { Router } from "express";
import SuratKeputusan from "./SuratKeputusan.route";
import PegawaiMutasi from "./PegawaiMutasi.route";
import Golongan from "./Golongan.route";
import Kantor from "./Kantor.route";
const router = Router();

router.use("/SuratKeputusan", SuratKeputusan);
router.use("/PegawaiMutasi", PegawaiMutasi);
router.use("/Golongan", Golongan);
router.use("/Kantor", Kantor);

export default router;
