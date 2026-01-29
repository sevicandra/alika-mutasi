import { Router } from "express";
import z from "zod";
import { DokumenControllerV2 } from "@/controllers/v2/pegawai/dokumen.controller";
import { uploadPdfMemory } from "@/middlewares/multer.middleware";
import { validateBodyWithFile, validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const setPejabatSchema = z.object({
  nama: z.string("Nama is required"),
  nip: z
    .string("NIP is required")
    .regex(
      /^(19[6-9]\d|20\d{2})(0[1-9]|1[0-2])(0[1-9]|[1-2]\d|3[0-1])(19[8-9]\d|20\d{2})(0[1-9]|1[0-2])([1-2])(\d{3})$/,
      "Invalid NIP"
    ),
});

const tteSchema = z.object({
  passphrase: z.string("Passphrase is required"),
});

const uploadSchema = z.object({
  file: z
    .object({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.enum(["application/pdf"], "Format file tidak didukung. Harap upload PDF."),
      size: z.number().max(50 * 1024 * 1024, {
        message: `Ukuran file maksimal adalah 50MB.`,
      }),
      buffer: z.instanceof(Buffer),
    },{
      message: "File is required",
    })
});

router.get("/", DokumenControllerV2.getAll);
router.post("/:dokumenId", validateBody(tteSchema), DokumenControllerV2.Tte);
router.get("/:dokumenId/File", DokumenControllerV2.getFile);
router.post(
  "/:dokumenId/File",
  uploadPdfMemory,
  validateBodyWithFile(uploadSchema),
  DokumenControllerV2.uploadFile
);
router.delete("/:dokumenId/File", DokumenControllerV2.deleteFile);
router.get("/:dokumenId/SPD2/Status", DokumenControllerV2.getStatusSPD2);
router.post(
  "/:dokumenId/SPD2/KantorAsal",
  validateBody(setPejabatSchema),
  DokumenControllerV2.setPejabatKantorAsal
);
router.post(
  "/:dokumenId/SPD2/KantorTujuan",
  validateBody(setPejabatSchema),
  DokumenControllerV2.setPejabatKantorTujuan
);
router.delete("/:dokumenId/SPD2/KantorAsal", DokumenControllerV2.removePejabatKantorAsal);
router.delete("/:dokumenId/SPD2/KantorTujuan", DokumenControllerV2.removePejabatKantorTujuan);

export default router;
