import { BaseQueueProducer } from "@/bullmq/base-queue-producer";
import { TerminJob } from "@/types/Job";

export const TerminQueue = new BaseQueueProducer<TerminJob>("termin");
