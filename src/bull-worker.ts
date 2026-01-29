import dotenv from "dotenv";
import { redisService } from "@/services/redis-service";
import { processApproveMutasi } from "./jobs/ApproveMutasi.job";
import { processBiaya } from "./jobs/Biaya.job";
import { processKeluarga } from "./jobs/Keluarga.job";
import { processKirim } from "./jobs/KirimTagihan.job";
import { processTermin } from "./jobs/Termin.job";
import { approveMutasiQueue } from "./queues/ApproveMutasi.queue";
import { biayaQueue } from "./queues/Biaya.queue";
import { keluargaQueue } from "./queues/Keluarga.queue";
import { kirimTagihanQueue } from "./queues/KirimTagihan.queue";
import { terminQueue } from "./queues/Termin.queue";
import "./register-alias";

dotenv.config();
const startServer = async () => {
  await redisService.connect();

  keluargaQueue.process("keluarga", processKeluarga);
  biayaQueue.process("biaya", processBiaya);
  terminQueue.process("termin", processTermin);
  approveMutasiQueue.process("approve_mutasi", processApproveMutasi);
  kirimTagihanQueue.process("kirim_tagihan", processKirim);

  keluargaQueue.on("failed", (job, err) => {
    console.log("Job failed:", job.id, err);
    if (job.attemptsMade < 3) {
      console.log("Retrying job:", job.id);
    } else {
      console.log("Failed job:", job.id);
      job.remove();
    }
  });

  biayaQueue.on("failed", (job, err) => {
    console.log("Job failed:", job.id, err);
    if (job.attemptsMade < 3) {
      console.log("Retrying job:", job.id);
    } else {
      console.log("Failed job:", job.id);
      job.remove();
    }
  });

  terminQueue.on("failed", (job, err) => {
    console.log("Job failed:", job.id, err);
    if (job.attemptsMade < 3) {
      console.log("Retrying job:", job.id);
    } else {
      console.log("Failed job:", job.id);
      job.remove();
    }
  });

  kirimTagihanQueue.on("failed", (job, err) => {
    console.log("Job failed:", job.id, err);
    if (job.attemptsMade < 3) {
      console.log("Retrying job:", job.id);
    } else {
      console.log("Failed job:", job.id);
      job.remove();
    }
  });

  approveMutasiQueue.on("failed", (job, err) => {
    console.log("Job failed:", job.id, err);
    if (job.attemptsMade < 3) {
      console.log("Retrying job:", job.id);
    } else {
      console.log("Failed job:", job.id);
      job.remove();
    }
  });
};

startServer();
