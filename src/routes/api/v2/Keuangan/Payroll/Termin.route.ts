import { Router } from "express";
import { TerminController } from "@/controllers/v2/keuangan/payroll/termin.controller";
import z from "zod";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const updateRekeningSchema = z.object({
  nama_rekening: z.string("Nama Rekening is required").max(100),
  nama_bank: z.string("Nama Bank is required").max(100),
  nomor_rekening: z
    .string("Nomor Rekening is required")
    .regex(/^\d+$/, "Nomor Rekening must be numeric"),
});

router.get("/", TerminController.getAll);
router.post("/:TerminId/Tolak", TerminController.tolak);
router.get("/:TerminId/Rekening", TerminController.getRekening);
router.patch(
  "/:TerminId/Rekening",
  validateBody(updateRekeningSchema),
  TerminController.updateRekening
);

export default router;
