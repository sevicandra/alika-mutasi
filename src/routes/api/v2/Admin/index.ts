import { Router } from "express";
import Refrensi from "./Referensi";

const router = Router({ mergeParams: true });

router.use("/Referensi", Refrensi);

export default router;
