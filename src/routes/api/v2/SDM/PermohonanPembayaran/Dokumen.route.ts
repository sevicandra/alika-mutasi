import { getDokumenFile } from "@/controllers/v2/sdm/dokumen.controller";
import { Router } from "express";

const router = Router({ mergeParams: true });


router.get("/:dokumenId/File", getDokumenFile);

export default router;

