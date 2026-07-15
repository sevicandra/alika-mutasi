import pm2 from "pm2";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";

export const PM2ControllerV1 = {
  getStatus: asyncHandler(async (_req, res) => {
    // 1. Hubungkan ke daemon PM2
    pm2.connect((connectErr) => {
      if (connectErr) {
        throw new InternalServerError(`Gagal terhubung ke PM2: ${connectErr.message}`);
      }

      // 2. Ambil list proses secara terstruktur (bukan teks mentah)
      pm2.list((listErr, processList) => {
        // Selalu diskonek setelah selesai menggunakan PM2 API
        pm2.disconnect();

        if (listErr) {
          throw new InternalServerError(`Gagal mengambil data PM2: ${listErr.message}`);
        }

        // 3. Mapping data ke format bersih yang kamu butuhkan
        const data = processList.map((proc) => {
          // Konversi memori ke MB agar mudah dibaca
          const memInMb = proc.monit?.memory
            ? `${(proc.monit.memory / 1024 / 1024).toFixed(1)} MB`
            : "0 MB";

          return {
            id: proc.pm_id,
            name: proc.name,
            pid: proc.pid,
            status: proc.pm2_env?.status, // 'online', 'stopping', 'stopped', dll.
            cpu: `${proc.monit?.cpu || 0}%`,
            mem: memInMb,
          };
        });

        // 4. Kirim respons sukses
        successResponse(res, "Status PM2 Berhasil Diambil", data);
      });
    });
  }),
  restartAll: asyncHandler(async (_req, res) => {
    pm2.connect((connectErr) => {
      if (connectErr) {
        throw new InternalServerError(`Gagal terhubung ke PM2: ${connectErr.message}`);
      }

      pm2.restart("all", (restartErr, processList) => {
        pm2.disconnect();

        if (restartErr) {
          throw new InternalServerError(`Gagal me-restart semua service: ${restartErr.message}`);
        }

        successResponse(res, "Semua service berhasil di-restart", processList);
      });
    });
  }),
  restart: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      throw new Error("Invalid ID");
    }
    pm2.connect((connectErr) => {
      if (connectErr) {
        throw new InternalServerError(`Gagal terhubung ke PM2: ${connectErr.message}`);
      }

      pm2.restart(id, (restartErr, processList) => {
        pm2.disconnect();

        if (restartErr) {
          throw new InternalServerError(`Gagal me-restart service ${id}: ${restartErr.message}`);
        }

        successResponse(res, `Service ${id} berhasil di-restart`, processList);
      });
    });
  }),
};
