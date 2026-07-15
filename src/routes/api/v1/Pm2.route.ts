import { Router } from "express";
import { PM2ControllerV1 } from "@/controllers/v1/pm2.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";

const router = Router();

router.get("/", authorizeScopes(["mutasi.pm2.read"]), PM2ControllerV1.getStatus);
router.post("/ResetAll", authorizeScopes(["mutasi.pm2.write"]), PM2ControllerV1.restartAll);
router.post("/Reset/:id", authorizeScopes(["mutasi.pm2.write"]), PM2ControllerV1.restart);

export default router;
