import dotenv from "dotenv";
import "./register-alias";
dotenv.config();
import { keluargaQueue } from "./queues/Keluarga.queue";
import { processKeluarga } from "./jobs/Keluarga.job";
import { biayaQueue } from "./queues/Biaya.queue";
import { processBiaya } from "./jobs/Biaya.job";
import { terminQueue } from "./queues/Termin.queue";
import { processTermin } from "./jobs/Termin.job";
import { approveMutasiQueue } from "./queues/ApproveMutasi.queue";
import { processApproveMutasi } from "./jobs/ApproveMutasi.job";
import { kirimTagihanQueue } from "./queues/KirimTagihan.queue";
import { processKirim } from "./jobs/KirimTagihan.job";

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
