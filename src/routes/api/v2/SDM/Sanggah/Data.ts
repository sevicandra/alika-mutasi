import { Router } from "express";
import { getAllDataSanggah, getSuratKeputusanFile } from "@/controllers/v2/sdm/dataSanggah.controller";

const router = Router({ mergeParams: true });
router.get("/", getAllDataSanggah);
router.get("/:DataId/File", getSuratKeputusanFile);

export default router;
