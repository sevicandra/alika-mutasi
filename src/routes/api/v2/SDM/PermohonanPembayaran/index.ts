import { Router } from "express";
import z from "zod";
import { PermohonanPembayaranControllerV2 } from "@/controllers/v2/sdm/permohonanPembayaran.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";
import Dokumen from "./Dokumen.route";

const router = Router({ mergeParams: true });

const approveRejectSchema = z.object({
  catatan: z.string("Catatan is required").min(1, "Catatan is required"),
});

router.get("/", PermohonanPembayaranControllerV2.getAll);
router.get("/:permohonanId", PermohonanPembayaranControllerV2.getById);
router.post(
  "/:permohonanId/Setuju",
  validateBody(approveRejectSchema),
  PermohonanPembayaranControllerV2.approve
);
router.post(
  "/:permohonanId/Tolak",
  validateBody(approveRejectSchema),
  PermohonanPembayaranControllerV2.reject
);
router.use("/:permohonanId/Dokumen", Dokumen);
export default router;
