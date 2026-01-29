import { Router } from "express";
import Barang from "./Barang.route";
import Darat from "./Darat.route";
import Faq from "./Faq.route";
import Golongan from "./Golongan.route";
import HubunganKeluarga from "./HubunganKeluarga.route";
import Kantor from "./Kantor.route";
import Kapal from "./Kapal.route";
import Pejabat from "./Pejabat.route";
import Pesawat from "./Pesawat.route";
import Provinsi from "./Provinsi.route";
import Tarif from "./Tarif.route";
import UangHarian from "./UangHarian.route";

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
