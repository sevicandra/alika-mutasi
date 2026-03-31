import { BulkJobOptions, JobType, JobsOptions, Queue } from "bullmq";
import { bullmqConfig } from "@/config/bullmq";

export class BaseQueueProducer<T> {
  protected queueName: string;
  protected queue: Queue;
  protected connection = bullmqConfig;

  constructor(queueName: string) {
    this.queueName = queueName;
    this.queue = new Queue(queueName, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      },
    });
  }

  // ============================================================
  // Job Management: Add
  // ============================================================

  async addJob(name: string, data: T, jobId: string, opts?: Omit<JobsOptions, "jobId">) {
    return await this.queue.add(name, data, { jobId, ...opts });
  }

  async addBulkJob(name: string, data: T[], opts?: BulkJobOptions) {
    const bulkJobs = data.map((item) => ({ name, data: item, opts }));
    return await this.queue.addBulk(bulkJobs);
  }

  /** Add a delayed job yang akan diproses setelah delay (ms) */
  async addDelayedJob(
    name: string,
    data: T,
    jobId: string,
    delay: number,
    opts?: Omit<JobsOptions, "jobId" | "delay">
  ) {
    return await this.queue.add(name, data, { jobId, delay, ...opts });
  }

  /** Add a prioritized job (lower number = higher priority) */
  async addPriorityJob(
    name: string,
    data: T,
    jobId: string,
    priority: number,
    opts?: Omit<JobsOptions, "jobId" | "priority">
  ) {
    return await this.queue.add(name, data, { jobId, priority, ...opts });
  }

  // ============================================================
  // Job Management: Query
  // ============================================================

  async getJob(id: string) {
    return await this.queue.getJob(id);
  }

  async getJobs(types?: JobType | JobType[], start?: number, end?: number, asc?: boolean) {
    return await this.queue.getJobs(
      types ?? ["waiting", "active", "delayed", "failed"],
      start,
      end,
      asc
    );
  }

  async getJobCounts() {
    return await this.queue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
      "prioritized"
    );
  }

  async getActiveJobs(start?: number, end?: number) {
    return await this.queue.getActive(start, end);
  }

  async getWaitingJobs(start?: number, end?: number) {
    return await this.queue.getWaiting(start, end);
  }

  async getFailedJobs(start?: number, end?: number) {
    return await this.queue.getFailed(start, end);
  }

  async getDelayedJobs(start?: number, end?: number) {
    return await this.queue.getDelayed(start, end);
  }

  async getCompletedJobs(start?: number, end?: number) {
    return await this.queue.getCompleted(start, end);
  }

  /** Get total count of waiting + delayed + prioritized + waiting-children */
  async getWaitingCount() {
    return await this.queue.count();
  }

  /** Get job logs (useful for debugging) */
  async getJobLogs(jobId: string, start?: number, end?: number) {
    return await this.queue.getJobLogs(jobId, start, end);
  }

  // ============================================================
  // Job Management: Remove
  // ============================================================

  /** Remove a specific job by ID */
  async removeJob(jobId: string) {
    return await this.queue.remove(jobId);
  }

  /**
   * Clean jobs berdasarkan grace period dan status.
   * @param grace - Grace period in ms (jobs older than this will be removed)
   * @param limit - Max number of jobs to clean
   * @param status - Job status to clean (default: "completed")
   */
  async clean(
    grace: number,
    limit: number,
    status?: "completed" | "wait" | "active" | "delayed" | "failed"
  ) {
    return await this.queue.clean(grace, limit, status ?? "completed");
  }

  /** Drain queue: remove all waiting and delayed jobs (not active/completed/failed) */
  async drain(delayed?: boolean) {
    return await this.queue.drain(delayed);
  }

  /**
   * Obliterate: completely destroy queue and all its contents.
   * Use with caution - this is irreversible.
   */
  async obliterate(opts?: { force?: boolean; count?: number }) {
    return await this.queue.obliterate(opts);
  }

  // ============================================================
  // Job Management: Retry & Promote
  // ============================================================

  /** Retry all failed jobs - move them back to waiting */
  async retryAllFailedJobs() {
    return await this.queue.retryJobs({ state: "failed" });
  }

  /** Promote all delayed jobs - move them to waiting immediately */
  async promoteAllDelayedJobs() {
    return await this.queue.promoteJobs();
  }

  // ============================================================
  // Queue State Management
  // ============================================================

  /** Pause queue globally (no worker will pick up new jobs) */
  async pause() {
    return await this.queue.pause();
  }

  /** Resume queue globally */
  async resume() {
    return await this.queue.resume();
  }

  /** Check if queue is currently paused */
  async isPaused() {
    return await this.queue.isPaused();
  }

  // ============================================================
  // Repeatable Jobs
  // ============================================================

  /** Add a repeatable/cron job */
  async addRepeatableJob(
    name: string,
    data: T,
    pattern: string, // cron pattern, e.g. "0 */5 * * * *" (every 5 min)
    opts?: Omit<JobsOptions, "repeat">
  ) {
    return await this.queue.add(name, data, {
      ...opts,
      repeat: { pattern },
    });
  }

  /** Get all repeatable jobs */
  async getRepeatableJobs(start?: number, end?: number, asc?: boolean) {
    return await this.queue.getRepeatableJobs(start, end, asc);
  }

  /** Remove a repeatable job by name and repeat options */
  async removeRepeatableJob(name: string, repeatOpts: { pattern: string }, jobId?: string) {
    return await this.queue.removeRepeatable(name, repeatOpts, jobId);
  }

  // ============================================================
  // Monitoring & Metrics
  // ============================================================

  /** Get connected workers info */
  async getWorkers() {
    return await this.queue.getWorkers();
  }

  /** Get queue metrics (job counts per unit of time) */
  async getMetrics(type: "completed" | "failed", start?: number, end?: number) {
    return await this.queue.getMetrics(type, start, end);
  }

  /** Trim event stream to prevent Redis memory bloat */
  async trimEvents(maxLength: number) {
    return await this.queue.trimEvents(maxLength);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /** Close the queue connection gracefully */
  async close() {
    return await this.queue.close();
  }

  /** Get the underlying Queue instance for advanced usage */
  getQueue() {
    return this.queue;
  }
}