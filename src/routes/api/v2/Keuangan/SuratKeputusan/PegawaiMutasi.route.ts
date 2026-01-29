import { Router } from "express";
import { PegawaiMutasiController } from "@/controllers/v2/keuangan/suratKeputusan/pagawaiMutasi.controller";

const router = Router({ mergeParams: true });

router.get("/", PegawaiMutasiController.getAll);
router.get("/Count", PegawaiMutasiController.count);
router.get("/:PegawaiId", PegawaiMutasiController.getById);

export default router;
