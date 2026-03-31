import { BaseQueueProducer } from "@/bullmq/base-queue-producer";

export const KeluargaQueue = new BaseQueueProducer<{
  pegawaiId: string;
}>("keluarga");
