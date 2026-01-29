import { Router } from "express";
import { RincianBiayaControllerV2 } from "@/controllers/v2/sdm/rincianBiaya.controller";
import z from "zod";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createRincianBiayaSchema = z.object({
  jenis: z.enum(
    [
      "BIAYA_ANGKUT_ORANG",
      "BIAYA_ANGKUT_BARANG",
      "UANG_HARIAN",
      "BIAYA_ANGKUT_ORANG_ART",
      "BIAYA_ANGKUT_BARANG_ART",
      "UANG_HARIAN_ART",
    ],
    "Invalid jenis"
  ),
  sub_jenis: z.string("Sub jenis is required").max(100, "Sub jenis must be at most 100 characters"),
  keterangan: z
    .string("Keterangan is required")
    .max(255, "Keterangan must be at most 255 characters"),
  volume: z.number("Volume is required").positive("Volume must be a positive number"),
  harga_satuan: z
    .number("Harga satuan is required")
    .positive("Harga satuan must be a positive number"),
  urutan: z.number("Urutan is required").positive("Urutan must be a positive number").optional(),
});
const updateRincianBiayaSchema = createRincianBiayaSchema.partial();
router.get("/", RincianBiayaControllerV2.getAll);
router.get("/:RincianBiayaId", RincianBiayaControllerV2.getById);
router.post("/", validateBody(createRincianBiayaSchema), RincianBiayaControllerV2.create);
router.post("/Reset", RincianBiayaControllerV2.reset);
router.patch(
  "/:RincianBiayaId",
  validateBody(updateRincianBiayaSchema),
  RincianBiayaControllerV2.update
);
router.delete("/:RincianBiayaId", RincianBiayaControllerV2.delete);

export default router;
