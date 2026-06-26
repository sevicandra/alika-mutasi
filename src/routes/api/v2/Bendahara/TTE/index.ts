import { Router } from "express";
import z from "zod";
import { TteControllerV2 } from "@/controllers/v2/bendahara/tte.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const tteSchema = z.object({
  passphrase: z.string("Passphrase is required"),
  confirmation: z.boolean("Konfirmasi is required").refine((value) => value === true, {
    message: "Konfirmasi is required",
  }),
});

router.get("/", TteControllerV2.getAll);
router.get("/:id", TteControllerV2.getById);
router.get("/:id/File", TteControllerV2.getFile);
router.post("/:id/Process", validateBody(tteSchema), TteControllerV2.process);
export default router;
