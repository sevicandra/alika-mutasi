import { Router } from "express";
import Golongan from "./Golongan.route";
import Kantor from "./Kantor.route";
import HubunganKeluarga from "./HubunganKeluarga.route";
import Termin from "./Termin.route";

const router = Router();

router.use("/Golongan", Golongan);
router.use("/Kantor", Kantor);
router.use("/HubunganKeluarga", HubunganKeluarga);
router.use("/Termin", Termin);

export default router;
