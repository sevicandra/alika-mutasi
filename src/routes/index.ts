import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate.middleware";
import API from "./api";
import Public from "./public";

const router = Router();

router.use("/api", authenticate, API);
router.use("/public", Public);

export default router;
