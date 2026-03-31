import dotenv from "dotenv";
import { redisService } from "@/services/redis-service";
import { ApproveMutasiWorker } from "@/bullmq/workers/approve-mutasi";
import { BiayaWorker } from "@/bullmq/workers/biaya";
import { KeluargaWorker } from "@/bullmq/workers/keluarga";
import { KirimTagihanWorker } from "@/bullmq/workers/kirim-tagihan";
import { TerminWorker } from "@/bullmq/workers/termin";
import "./register-alias";

dotenv.config();
const startServer = async () => {
  await redisService.connect();
  process.on("SIGTERM", () => {
    Promise.all([
      ApproveMutasiWorker.close(),
      BiayaWorker.close(),
      KeluargaWorker.close(),
      KirimTagihanWorker.close(),
      TerminWorker.close(),
    ]);
    process.exit(0);
  });

  process.on("SIGINT", () => {
    Promise.all([
      ApproveMutasiWorker.close(),
      BiayaWorker.close(),
      KeluargaWorker.close(),
      KirimTagihanWorker.close(),
      TerminWorker.close(),
    ]);
    process.exit(0);
  });
};

startServer();
