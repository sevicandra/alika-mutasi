import { Router } from "express";
import Golongan from "./Golongan.route";
import Kantor from "./Kantor.route";
import HubunganKeluarga from "./HubunganKeluarga.route";
import Termin from "./Termin.route";
import DaftarPegawai from "./DaftarPegawai.route";
import Wilayah from "./Wilayah.route";

const router = Router();

router.use("/Golongan", Golongan);
router.use("/Kantor", Kantor);
router.use("/HubunganKeluarga", HubunganKeluarga);
router.use("/Termin", Termin);
router.use("/DaftarPegawai", DaftarPegawai);
router.use("/Wilayah", Wilayah);

export default router;
