import { Router } from "express"
import {
getAllRefHubunganKeluarga
} from "@/controllers/v2/referensi/HubunganKeluarga.controller"

const router = Router();

router.get("/", getAllRefHubunganKeluarga);

export default router;