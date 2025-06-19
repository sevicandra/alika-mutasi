import { Router } from "express";

import {
    getAllRefTermin
} from "@/controllers/v2/referensi/Termin.controller";

const router = Router();

router.get("/", getAllRefTermin);

export default router;