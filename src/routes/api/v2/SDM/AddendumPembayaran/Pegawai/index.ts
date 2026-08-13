import { Router } from "express";
import { PegawaiMutasiControllerV2 } from "@/controllers/v2/sdm/addendumPembayaran/pegawai.controller";
import RincianBiaya from "./RincianBiaya.route";
import Termin from "./Termin.route";

const router = Router({ mergeParams: true });

router.get("/", PegawaiMutasiControllerV2.getAll);
router.post("/:PegawaiId/Process", PegawaiMutasiControllerV2.process);
router.use("/:PegawaiId/RincianBiaya", RincianBiaya);
router.use("/:PegawaiId/Termin", Termin);

export default router;
