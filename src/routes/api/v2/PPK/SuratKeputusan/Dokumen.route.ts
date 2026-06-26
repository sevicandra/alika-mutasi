import { Router } from "express";
import { DokumenController } from "@/controllers/v2/ppk/suratKeputusan/dokumen.controller";

const router = Router({ mergeParams: true });

router.get("/", DokumenController.getAll);
router.get("/:DokumenId/File", DokumenController.getFile);

export default router;
