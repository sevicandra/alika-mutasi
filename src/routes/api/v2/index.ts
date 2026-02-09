import { Router } from "express";
import { authorizeRoles } from "@/middlewares/authenticate.middleware";
import Admin from "./Admin";
import Keuangan from "./Keuangan";
import Pegawai from "./Pegawai";
import Referensi from "./Referensi";
import SDM from "./SDM";

const router = Router({ mergeParams: true });
router.use("/SDM", authorizeRoles(["mutasi.SDM"]), SDM);
router.use("/Referensi", authorizeRoles(), Referensi);
router.use("/Pegawai", authorizeRoles(), Pegawai);
router.use("/Keuangan", authorizeRoles(["mutasi.KEUANGAN"]), Keuangan);
router.use("/Admin", authorizeRoles(["mutasi.ADMIN"]), Admin);
router.use("/Ppk", authorizeRoles(["mutasi.PPK"]), Admin);
router.use("/Bendahara", authorizeRoles(["mutasi.Bendahara"]), Admin);
export default router;
