import { Router } from "express";
import Golongan from "./Golongan.route";
import Kantor from "./Kantor.route";
import HubunganKeluarga from "./HubunganKeluarga.route";
import Termin from "./Termin.route";
import DaftarPegawai from "./DaftarPegawai.route";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

router.use("/Golongan", authenticate(), Golongan);
router.use("/Kantor", authenticate(), Kantor);
router.use("/HubunganKeluarga", authenticate(), HubunganKeluarga);
router.use("/Termin", authenticate(), Termin);
router.use("/DaftarPegawai", authenticate(), DaftarPegawai);

export default router;
