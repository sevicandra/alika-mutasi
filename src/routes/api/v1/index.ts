import { Router } from "express";
import Golongan from "./Golongan.route";
import Kantor from "./Kantor.route";
import PegawaiMutasi from "./PegawaiMutasi.route";
import SuratKeputusan from "./SuratKeputusan.route";

const router = Router();

router.use("/SuratKeputusan", SuratKeputusan);
router.use("/PegawaiMutasi", PegawaiMutasi);
router.use("/Golongan", Golongan);
router.use("/Kantor", Kantor);

export default router;
