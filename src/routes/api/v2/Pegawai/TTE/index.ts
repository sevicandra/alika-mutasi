import { Router } from "express";
import z from "zod";
import { TteControllerV2 } from "@/controllers/v2/pegawai/tte.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const tteSchema = z.object({
  passphrase: z.string("Passphrase is required"),
  tanggal: z.string().optional(),
});

router.get("/", TteControllerV2.getAll);
router.get("/:id", TteControllerV2.getById);
router.get("/:id/File", TteControllerV2.getFile);
router.post("/:id/Process", validateBody(tteSchema), TteControllerV2.process);
router.post("/:id/Tolak", TteControllerV2.reject);
export default router;
