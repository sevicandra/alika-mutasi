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
import { authenticate } from "@/middlewares/auth.middleware";
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

router.get("/", authenticate(["mutasi.pegawai.read"]), getAllPegawaiMutasi);
router.get("/Count", authenticate(["mutasi.pegawai.read"]), countAllPegawaiMutasi);
router.get("/:id", authenticate(["mutasi.pegawai.read"]), getPegawaiMutasiById);
router.post("/", authenticate(["mutasi.pegawai.write"]), createPegawaiMutasi);
router.post("/ImportCSV", authenticate(["mutasi.pegawai.write"]), upload.single("file"), importCsvPegawaiMutasi);
router.post("/:id/ResetData", authenticate(["mutasi.pegawai.revoke"]), resetDataPegawaiMutasi);
router.patch("/:id", authenticate(["mutasi.pegawai.update"]), updatePegawaiMutasi);
router.delete("/:id", authenticate(["mutasi.pegawai.delete"]), deletePegawaiMutasi);

router.use("/:PegawaiId/Keluarga", Keluarga);
router.use("/:PegawaiId/RincianBiaya", RincianBiaya);

export default router;
