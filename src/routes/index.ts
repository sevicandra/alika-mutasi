import { Router } from "express";
import API from "./api";

const router = Router();

router.use("/api", API);


export default router;
