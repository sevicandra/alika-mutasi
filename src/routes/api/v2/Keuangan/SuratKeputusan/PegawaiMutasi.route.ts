import { Router } from "express";
import {
  getAllPegawaiMutasi,
  getPegawaiMutasiById,
  countAllPegawaiMutasi,
} from "@/controllers/v2/keuangan/suratKeputusan/pagawaiMutasi.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllPegawaiMutasi);
router.get("/Count", countAllPegawaiMutasi);
router.get("/:PegawaiId", getPegawaiMutasiById);

export default router;
