import { Router } from "express";
import {
  getAllDokumen,
  getDokumenFile,
} from "@/controllers/v2/keuangan/suratKeputusan/dokumen.controller";

const router = Router({ mergeParams: true });

router.get("/", getAllDokumen);
router.get("/:DokumenId/File", getDokumenFile);

export default router;
