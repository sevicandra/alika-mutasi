import { Router } from "express";
import SDM from "./SDM";
import Referensi from "./Referensi";
import Pegawai from "./Pegawai";
import Keuangan from "./Keuangan";
import Admin from "./Admin";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router({ mergeParams: true });
router.use("/SDM", authenticate([], ["SDM"]), SDM);
router.use("/Referensi", authenticate(), Referensi);
router.use("/Pegawai", authenticate(), Pegawai);
router.use("/Keuangan", authenticate([], ["KEUANGAN"]), Keuangan);
router.use("/Admin", authenticate([], ["ADMIN"]), Admin);

export default router;