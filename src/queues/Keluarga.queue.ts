import Queue from "bull";
import { queueOptions } from "@/config/queue.config";

export const keluargaQueue = new Queue("keluarga", queueOptions);
