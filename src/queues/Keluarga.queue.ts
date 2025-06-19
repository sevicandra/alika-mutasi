import { queueOptions } from "@/config/queue.config";
import Queue from "bull";

export const keluargaQueue = new Queue("keluarga", queueOptions);
