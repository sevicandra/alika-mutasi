import { Job, Worker } from "bullmq";
import { bullmqConfig } from "@/config/bullmq";

export class BaseQueueWorker<T> {
  protected queueName: string;
  protected worker: Worker;
  protected connection = bullmqConfig;

  constructor(queueName: string, processor: (job: Job<T, void, string>) => Promise<void>) {
    this.queueName = queueName;
    this.worker = new Worker(queueName, processor, {
      connection: this.connection,
      concurrency: 1,
    });

    this.worker.on("active", (job) => {
      console.log(`[Worker] Job ${job.id} started`);
    });

    this.worker.on("ready", () => console.log("[Worker] Ready to process jobs"));

    this.worker.on("completed", (job) => {
      console.log(`[Worker] Job ${job.id} completed`);
    });

    this.worker.on("stalled", (jobId) => console.warn(`Job stalled: ${jobId}`));

    this.worker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });
  }

  async close() {
    await this.worker.close();
  }
}
