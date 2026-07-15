import { Router } from "express";
import Golongan from "./Golongan.route";
import Kantor from "./Kantor.route";
import PegawaiMutasi from "./PegawaiMutasi.route";
import Pm2 from "./Pm2.route";
import SuratKeputusan from "./SuratKeputusan.route";

const router = Router();

router.use("/Golongan", Golongan);
router.use("/Kantor", Kantor);
router.use("/PegawaiMutasi", PegawaiMutasi);
router.use("/PM2", Pm2);
router.use("/SuratKeputusan", SuratKeputusan);

export default router;
