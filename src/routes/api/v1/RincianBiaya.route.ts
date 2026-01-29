import { Router } from "express";
import { RincianBiayaControllerV1 } from "@/controllers/v1/rincianBiaya.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";

const router = Router({ mergeParams: true });

router.get("/", authorizeScopes(["mutasi.rincianBiaya.read"]), RincianBiayaControllerV1.getAll);

export default router;
