import { Router } from "express";
import z from "zod";
import { PembayaranControllerV2 } from "@/controllers/v2/pegawai/pembayaran.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";
import Dokumen from "./Dokumen.route";

const router = Router({ mergeParams: true });

const approveSchema = z.object({
  passphrase: z.string("Passphrase is required"),
  confirmation: z.boolean("Confirmation is required").refine((value) => value === true, {
    message: "Confirmation is required",
  }),
});

router.get("/", PembayaranControllerV2.getAll);
router.get("/:terminId", PembayaranControllerV2.getById);
router.use("/:terminId/Dokumen", Dokumen);
router.post("/:terminId/Kirim", validateBody(approveSchema), PembayaranControllerV2.kirim);

export default router;
