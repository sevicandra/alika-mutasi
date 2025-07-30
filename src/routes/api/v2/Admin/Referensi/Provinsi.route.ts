import { Router } from "express";
import {
  getAllProvinsi,
  getProvinsiById,
  createProvinsi,
  updateProvinsi,
  deleteProvinsi,
  getAllKota,
  getKotaById,
  createKota,
  updateKota,
  deleteKota,
} from "@/controllers/v2/admin/referensi/provinsi.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllProvinsi);
router.get("/:KodeProv", getProvinsiById);
router.post("/", createProvinsi);
router.patch("/:KodeProv", updateProvinsi);
router.delete("/:KodeProv", deleteProvinsi);
router.get("/:KodeProv/Kota", getAllKota);
router.get("/:KodeProv/Kota/:KodeKota", getKotaById);
router.post("/:KodeProv/Kota", createKota);
router.patch("/:KodeProv/Kota/:KodeKota", updateKota);
router.delete("/:KodeProv/Kota/:KodeKota", deleteKota);



export default router;
