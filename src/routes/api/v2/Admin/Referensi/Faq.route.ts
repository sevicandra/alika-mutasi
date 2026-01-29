import { Router } from "express";
import z from "zod";
import { FaqControllerV2 } from "@/controllers/v2/admin/referensi/faq.controller";
import { validateBody } from "@/middlewares/validate-request.middleware";

const router = Router({ mergeParams: true });

const createFaqSchema = z.object({
  question: z.string("Question is required").max(255, "Question must be at most 255 characters"),
  answer: z.string("Answer is required").max(1000, "Answer must be at most 1000 characters"),
});

const updateFaqSchema = createFaqSchema.partial();

router.get("/", FaqControllerV2.getAll);
router.get("/:id", FaqControllerV2.getById);
router.post("/", validateBody(createFaqSchema), FaqControllerV2.create);
router.patch("/:id", validateBody(updateFaqSchema), FaqControllerV2.update);
router.delete("/:id", FaqControllerV2.delete);
router.patch("/:id/Publish", FaqControllerV2.publish);
router.patch("/:id/Draft", FaqControllerV2.draft);

export default router;
