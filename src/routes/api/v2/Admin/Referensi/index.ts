import { Router } from "express";
import Provinsi from "./Provinsi.route";
import Kantor from "./Kantor.route";
import Pesawat from "./Pesawat.route";
import Kapal from "./Kapal.route";
import Darat from "./Darat.route";
import Golongan from "./Golongan.route";
import Barang from "./Barang.route";
import HubunganKeluarga from "./HubunganKeluarga.route";
import Tarif from "./Tarif.route";
import UangHarian from "./UangHarian.route";
import Pejabat from "./Pejabat.route";
import Faq from "./Faq.route";

const router = Router({ mergeParams: true });

router.use("/Barang", Barang);
router.use("/Darat", Darat);
router.use("/Golongan", Golongan);
router.use("/HubunganKeluarga", HubunganKeluarga);
router.use("/Kantor", Kantor);
router.use("/Kapal", Kapal);
router.use("/Pejabat", Pejabat);
router.use("/Pesawat", Pesawat);
router.use("/Provinsi", Provinsi);
router.use("/Tarif", Tarif);
router.use("/UangHarian", UangHarian);
router.use("/Faq", Faq);

export default router;
