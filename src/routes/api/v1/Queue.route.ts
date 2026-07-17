import { Router } from "express";
import { QueueControllerV1 } from "@/controllers/v1/queue.controller";
import { authorizeScopes } from "@/middlewares/authenticate.middleware";

const router = Router();

router.get("/", authorizeScopes(["mutasi.queue.read"]), QueueControllerV1.getAllQueues);
router.get("/:name/jobs", authorizeScopes(["mutasi.queue.read"]), QueueControllerV1.getJobs);
router.get("/:name/jobs/:jobId", authorizeScopes(["mutasi.queue.read"]), QueueControllerV1.getJobDetail);
router.post("/:name/pause", authorizeScopes(["mutasi.queue.write"]), QueueControllerV1.pause);
router.post("/:name/resume", authorizeScopes(["mutasi.queue.write"]), QueueControllerV1.resume);
router.post("/:name/clean", authorizeScopes(["mutasi.queue.write"]), QueueControllerV1.clean);
router.post("/:name/drain", authorizeScopes(["mutasi.queue.write"]), QueueControllerV1.drain);
router.post("/:name/retry", authorizeScopes(["mutasi.queue.write"]), QueueControllerV1.retryAllFailed);
router.delete("/:name/jobs/:jobId", authorizeScopes(["mutasi.queue.write"]), QueueControllerV1.removeJob);

export default router;
