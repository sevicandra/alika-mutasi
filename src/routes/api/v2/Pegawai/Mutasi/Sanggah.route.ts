import { Router } from "express";
import multer from "multer";
import { createSanggah, getSanggah } from "@/controllers/v2/pegawai/sanggah.controller";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router({ mergeParams: true });

router.get("/", getSanggah);
router.post("/", upload.any(), createSanggah);


export default router;
