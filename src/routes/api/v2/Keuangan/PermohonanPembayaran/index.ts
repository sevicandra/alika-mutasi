import { Router } from "express";
import z from "zod";
import { PermohonanPembayaranController } from "@/controllers/v2/keuangan/permohonanPembayaran.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const approveRejectSchema = z.object({
  catatan: z.string("Catatan is required").min(1, "Catatan is required"),
});

router.get("/", PermohonanPembayaranController.getAll);
router.get("/:PermohonanId", PermohonanPembayaranController.getById);
router.get("/:PermohonanId/Dokumen/:DokumenId/File", PermohonanPembayaranController.getDokumenFile);
router.post(
  "/:PermohonanId/Setuju",
  validateBody(approveRejectSchema),
  PermohonanPembayaranController.approve
);
router.post(
  "/:PermohonanId/Tolak",
  validateBody(approveRejectSchema),
  PermohonanPembayaranController.reject
);
export default router;
