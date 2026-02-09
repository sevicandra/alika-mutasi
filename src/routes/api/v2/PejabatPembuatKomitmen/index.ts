import { Router } from "express";
import z from "zod";
import { PpkControllerV2 } from "@/controllers/v2/ppk.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const tteSchema = z.object({
  passphrase: z.string("Passphrase is required"),
});

router.get("/", PpkControllerV2.getAll);
router.get("/:id", PpkControllerV2.getById);
router.get("/:id/File", PpkControllerV2.getFile);
router.post("/:id/Process", validateBody(tteSchema), PpkControllerV2.process);

export default router;
