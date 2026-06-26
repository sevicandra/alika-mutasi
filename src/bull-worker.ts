import dotenv from "dotenv";
import { minioService } from "@/services/minio-service";
import { redisService } from "@/services/redis-service";
import { ApproveMutasiWorker } from "@/bullmq/workers/approve-mutasi";
import { BiayaWorker } from "@/bullmq/workers/biaya";
import { KeluargaWorker } from "@/bullmq/workers/keluarga";
import { KirimTagihanWorker } from "@/bullmq/workers/kirim-tagihan";
import { TerminWorker } from "@/bullmq/workers/termin";
import "./register-alias";
import logger from "./utils/Logger.utils";

const startServer = async () => {
  dotenv.config();
  try {
    await redisService.connect();
  } catch (error) {
    logger.error("Failed to connect to Redis during startup. App will run without Redis cache.", {
      error,
    });
  }

  try {
    await minioService.ensureBucketExists();
  } catch (error) {
    logger.error(
      "Failed to initialize MinIO during startup. App will run without functional object storage.",
      { error }
    );
  }
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
