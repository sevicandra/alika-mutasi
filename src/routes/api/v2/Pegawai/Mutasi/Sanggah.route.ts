import { Router } from "express";
import { SanggahController } from "@/controllers/v2/pegawai/sanggah.controller";
import DataSanggah from "./DataSanggah.route";

const router = Router({ mergeParams: true });

router.get("/", SanggahController.getSanggah);
router.post("/Kirim", SanggahController.kirim);
router.use("/Data", DataSanggah);

export default router;
