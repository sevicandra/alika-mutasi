import { Router } from "express";
import { PembayaranControllerV2 } from "@/controllers/v2/pegawai/pembayaran.controller";
import Dokumen from "./Dokumen.route";
import z from "zod";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const approveSchema = z.object({
  passphrase: z.string("Passphrase is required"),
});

router.get("/", PembayaranControllerV2.getAll);
router.get("/:terminId", PembayaranControllerV2.getById);
router.use("/:terminId/Dokumen", Dokumen);
router.post("/:terminId/Kirim", validateBody(approveSchema), PembayaranControllerV2.kirim);

export default router;
