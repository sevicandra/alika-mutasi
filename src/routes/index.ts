import { Router } from "express";
import API from "./api";
import Public from "./public";

const router = Router();

router.use("/api", API);
router.use("/public", Public)


export default router;
