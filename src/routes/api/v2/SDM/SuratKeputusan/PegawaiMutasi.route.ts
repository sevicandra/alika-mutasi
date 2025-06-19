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
  hitungRincianBiaya,
} from "@/controllers/v2/sdm/pagawaiMutasi.controller";
import multer from "multer";

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
router.get("/:PegawaiId", getPegawaiMutasiById);
router.post("/", createPegawaiMutasi);
router.post("/ImportCSV", upload.single("file"), importCsvPegawaiMutasi);
router.post("/:PegawaiId/ResetData", resetDataPegawaiMutasi);
router.patch("/:PegawaiId", updatePegawaiMutasi);
router.delete("/:PegawaiId", deletePegawaiMutasi);
router.post("/:PegawaiId/Hitung", hitungRincianBiaya);

export default router;
