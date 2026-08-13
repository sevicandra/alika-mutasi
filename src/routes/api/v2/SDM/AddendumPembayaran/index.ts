import { Router } from "express";
import { SuratKeputusanControllerV2 } from "@/controllers/v2/sdm/addendumPembayaran/suratKeputusan.controller";
import Pegawai from "./Pegawai";

const router = Router({ mergeParams: true });

router.get("/", SuratKeputusanControllerV2.getAll);
router.use("/:SkId/Pegawai", Pegawai);

export default router;
