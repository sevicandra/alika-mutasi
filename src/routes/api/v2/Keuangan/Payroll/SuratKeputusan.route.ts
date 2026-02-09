import { Router } from "express";
import z from "zod";
import { SuratKeputusanController } from "@/controllers/v2/keuangan/payroll/suratKeputusan.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router();

const downloadSchema = z.object({
  terminId: z.array(z.string()),
  tanggal: z
    .string("Tanggal is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal must be in YYYY-MM-DD format")
    .min(1, "Tanggal is required"),
});

router.get("/", SuratKeputusanController.getAll);
router.get("/:SkId", SuratKeputusanController.getById);
router.post("/:SkId/Download", validateBody(downloadSchema), SuratKeputusanController.download);

export default router;
