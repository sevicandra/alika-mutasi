import { Router } from "express";
import Download from "./download";

const router = Router();

router.use("/download", Download);


export default router;
