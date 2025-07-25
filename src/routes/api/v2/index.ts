import { Router } from "express";
import SDM from "./SDM";
import Referensi from "./Referensi";
import Pegawai from "./Pegawai";
import Keuangan from "./Keuangan"


const router = Router({ mergeParams: true });
router.use("/SDM", SDM);
router.use("/Referensi", Referensi);
router.use("/Pegawai", Pegawai);
router.use("/Keuangan", Keuangan);


export default router;
