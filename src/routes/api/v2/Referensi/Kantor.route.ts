import {Router } from "express";
import {
    getAllKantor,
    getKantorById,
    createKantor,
    updateKantor,
    deleteKantor,
} from "@/controllers/v2/referensi/Kantor.controller";

const router = Router();    

router.get("/", getAllKantor);


export default router;