import { Router } from "express";
import {
  getAllPegawaiMutasi,
  getPegawaiMutasiById,
  createPegawaiMutasi,
  updatePegawaiMutasi,
  deletePegawaiMutasi,
  countAllPegawaiMutasi,
  importCsvPegawaiMutasi,
  resetDataPegawaiMutasi,
} from "@/controllers/v1/pagawaiMutasi.controller";
import multer from "multer";
import Keluarga from "./Keluarga.route";
import RincianBiaya from "./RincianBiaya.route";

const router = Router({ mergeParams: true });
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // maksimal 5MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".csv")) {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", getAllPegawaiMutasi);
router.get("/Count", countAllPegawaiMutasi);
router.get("/:id", getPegawaiMutasiById);
router.post("/", createPegawaiMutasi);
router.post("/ImportCSV", upload.single("file"), importCsvPegawaiMutasi);
router.post("/:id/ResetData", resetDataPegawaiMutasi);
router.patch("/:id", updatePegawaiMutasi);
router.delete("/:id", deletePegawaiMutasi);

router.use("/:PegawaiId/Keluarga", Keluarga);
router.use("/:PegawaiId/RincianBiaya", RincianBiaya);

export default router;
