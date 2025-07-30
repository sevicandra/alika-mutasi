import { Router } from "express";
import {
  getAllProvinsi,
  getKota,
} from "@/controllers/v2/referensi/Wilayah.controller";

const router = Router();

router.get("/", getAllProvinsi);
router.get("/:KodeProvinsi", getKota);

export default router;
