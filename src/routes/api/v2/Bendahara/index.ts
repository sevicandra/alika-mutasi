import { Router } from "express";
import z from "zod";
import { BendaharaControllerV2 } from "@/controllers/v2/bendahara.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const tteSchema = z.object({
  passphrase: z.string("Passphrase is required"),
});

router.get("/", BendaharaControllerV2.getAll);
router.get("/:id", BendaharaControllerV2.getById);
router.get("/:id/File", BendaharaControllerV2.getFile);
router.post("/:id/Process", validateBody(tteSchema), BendaharaControllerV2.process);

export default router;
