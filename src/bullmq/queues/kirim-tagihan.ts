import { BaseQueueProducer } from "@/bullmq/base-queue-producer";
import { PembayaranJob } from "@/types/Job";

export const KirimTagihanQueue = new BaseQueueProducer<PembayaranJob>("kirim-tagihan");
