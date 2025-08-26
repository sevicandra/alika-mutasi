import { Router } from "express";
import {
  getAllFaq,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  publishFaq,
  draftFaq,
} from "@/controllers/v2/admin/referensi/faq.controller";
const router = Router({ mergeParams: true });

router.get("/", getAllFaq);
router.get("/:id", getFaqById);
router.post("/", createFaq);
router.patch("/:id", updateFaq);
router.delete("/:id", deleteFaq);
router.patch("/:id/Publish", publishFaq);
router.patch("/:id/Draft", draftFaq);

export default router;
