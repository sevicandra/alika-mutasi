import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { ApproveMutasiQueue } from "@/bullmq/queues/approve-mutasi";
import { BiayaQueue } from "@/bullmq/queues/biaya";
import { KeluargaQueue } from "@/bullmq/queues/keluarga";
import { KirimTagihanQueue } from "@/bullmq/queues/kirim-tagihan";
import { TerminQueue } from "@/bullmq/queues/termin";
import { Job, JobType } from "bullmq";

const queues: Record<string, any> = {
  "approve-mutasi": ApproveMutasiQueue,
  "biaya": BiayaQueue,
  "keluarga": KeluargaQueue,
  "kirim-tagihan": KirimTagihanQueue,
  "termin": TerminQueue,
};

const getQueue = (name: string) => {
  const queue = queues[name];
  if (!queue) {
    throw new NotFoundError(`Queue '${name}'`);
  }
  return queue;
};

export const QueueControllerV1 = {
  getAllQueues: asyncHandler(async (_req: Request, res: Response) => {
    const queueList = [];
    for (const [name, queueProducer] of Object.entries(queues)) {
      const isPaused = await queueProducer.isPaused();
      const counts = await queueProducer.getJobCounts();
      const waitingCount = await queueProducer.getWaitingCount();
      queueList.push({
        name,
        isPaused,
        jobCounts: counts,
        waitingCount,
      });
    }
    successResponse(res, "Success get all queues status", queueList);
  }),

  getJobs: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    const queueProducer = getQueue(name);

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const typesParam = req.query.types as string;

    let types: JobType[] = ["waiting", "active", "delayed", "failed"];
    if (typesParam) {
      const parsedTypes = typesParam.split(",").map((t) => t.trim()) as JobType[];
      const validTypes = [
        "waiting",
        "active",
        "delayed",
        "failed",
        "completed",
        "paused",
        "prioritized",
        "wait",
      ];
      types = parsedTypes.filter((t) => validTypes.includes(t));
      if (types.length === 0) {
        throw new InvalidRequestError("Invalid job types provided");
      }
    }

    const start = offset;
    const end = offset + limit - 1;

    const jobs = (await queueProducer.getJobs(types, start, end, true)) as Job[];

    const formattedJobs = await Promise.all(
      jobs.map(async (job: Job) => {
        let state = "unknown";
        try {
          state = await job.getState();
        } catch {
          // ignore
        }
        return {
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          progress: job.progress,
          timestamp: job.timestamp,
          delay: job.delay,
          finishedOn: job.finishedOn,
          processedOn: job.processedOn,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
          state,
        };
      })
    );

    const jobCounts = await queueProducer.getJobCounts();

    let totalItems = 0;
    for (const type of types) {
      if (type === "waiting") totalItems += jobCounts.waiting || 0;
      else if (type === "active") totalItems += jobCounts.active || 0;
      else if (type === "delayed") totalItems += jobCounts.delayed || 0;
      else if (type === "failed") totalItems += jobCounts.failed || 0;
      else if (type === "completed") totalItems += jobCounts.completed || 0;
      else if (type === "prioritized") totalItems += jobCounts.prioritized || 0;
      else if (type === "paused") totalItems += jobCounts.paused || 0;
    }

    const pagination = {
      limit,
      offset,
      totalItems,
      jobCounts,
    };

    successResponse(res, `Success get jobs for queue ${name}`, formattedJobs, pagination);
  }),

  getJobDetail: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    const jobId = req.params.jobId;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    if (typeof jobId !== "string") {
      throw new InvalidRequestError("Job ID is required and must be a string");
    }

    const queueProducer = getQueue(name);
    const job = (await queueProducer.getJob(jobId)) as Job | null;
    if (!job) {
      throw new NotFoundError(`Job with ID '${jobId}' in queue '${name}'`);
    }

    let state = "unknown";
    try {
      state = await job.getState();
    } catch {
      // ignore
    }

    const jobDetail = {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      timestamp: job.timestamp,
      delay: job.delay,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      attemptsMade: job.attemptsMade,
      state,
    };

    successResponse(res, `Success get job detail for ${jobId}`, jobDetail);
  }),

  pause: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    const queueProducer = getQueue(name);
    await queueProducer.pause();
    successResponse(res, `Queue '${name}' has been paused`);
  }),

  resume: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    const queueProducer = getQueue(name);
    await queueProducer.resume();
    successResponse(res, `Queue '${name}' has been resumed`);
  }),

  clean: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    const queueProducer = getQueue(name);

    const grace = parseInt(req.query.grace as string) || 0;
    const limit = parseInt(req.query.limit as string) || 100;
    const status = (req.query.status as any) || "completed";

    const validStatuses = ["completed", "wait", "active", "delayed", "failed"];
    if (!validStatuses.includes(status)) {
      throw new InvalidRequestError(
        `Invalid status '${status}' for cleaning. Allowed values: ${validStatuses.join(", ")}`
      );
    }

    const cleaned = (await queueProducer.clean(grace, limit, status)) as any[];
    successResponse(res, `Queue '${name}' cleaned successfully`, {
      cleanedCount: cleaned.length,
      cleanedJobIds: cleaned.map((j: any) => (typeof j === "string" ? j : j.id)),
    });
  }),

  drain: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    const queueProducer = getQueue(name);

    const delayed = req.query.delayed === "true";
    await queueProducer.drain(delayed);

    successResponse(res, `Queue '${name}' has been drained`);
  }),

  retryAllFailed: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    const queueProducer = getQueue(name);

    await queueProducer.retryAllFailedJobs();
    successResponse(res, `All failed jobs in queue '${name}' have been retried`);
  }),

  removeJob: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    const jobId = req.params.jobId;
    if (typeof name !== "string") {
      throw new InvalidRequestError("Invalid queue name");
    }
    if (typeof jobId !== "string") {
      throw new InvalidRequestError("Job ID is required and must be a string");
    }

    const queueProducer = getQueue(name);
    const job = await queueProducer.getJob(jobId);
    if (!job) {
      throw new NotFoundError(`Job with ID '${jobId}' in queue '${name}'`);
    }

    await queueProducer.removeJob(jobId);
    successResponse(res, `Job '${jobId}' in queue '${name}' has been removed`);
  }),
};
