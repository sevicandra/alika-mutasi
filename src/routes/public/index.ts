import { Router } from "express";
import File from "./file";

const router = Router();

router.use("/file", File);


export default router;
