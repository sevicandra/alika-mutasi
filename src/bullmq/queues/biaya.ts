import { BaseQueueProducer } from "@/bullmq/base-queue-producer";
import { BiayaJob } from "@/types/Job";

export const BiayaQueue = new BaseQueueProducer<BiayaJob>("biaya");
