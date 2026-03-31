import { BaseQueueProducer } from "@/bullmq/base-queue-producer";
import { BiayaJob } from "@/types/Job";

export const ApproveMutasiQueue = new BaseQueueProducer<BiayaJob>("approve-mutasi");
