import { Router } from "express";
import { z } from "zod";
import { DashboardController } from "@/controllers/v2/pegawai/dashboard.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const getEstimasiSchema = z.object({
  kantor_asal: z.string("Kantor asal is required").regex(/^\d{6}$/, "Invalid input format"),
  kantor_tujuan: z.string("Kantor tujuan is required").regex(/^\d{6}$/, "Invalid input format"),
  tanggungan: z.number("Tanggungan is required").default(0),
  tanggungan_invant: z.number("Tanggungan invant is required").default(0),
  pasangan: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.enum(["TERTANGGUNG", "TIDAK TERTANGGUNG"], {
        message: "Pasangan harus berupa TERTANGGUNG atau TIDAK_TERTANGGUNG",
      })
    )
    .default("TIDAK TERTANGGUNG"),
  golongan: z.string("Golongan is required").regex(/^[1-4]$/, "Invalid input format"),
});

const router = Router({ mergeParams: true });

router.get("/Status", DashboardController.getStatus);
router.get("/Dokumen", DashboardController.getStatusDokumen);
router.get("/Biaya", DashboardController.getBiaya);
router.get("/Log", DashboardController.getHistory);
router.post("/Estimasi", validateBody(getEstimasiSchema), DashboardController.getEstimasi);
router.get("/Faq", DashboardController.getFaqs);

export default router;
