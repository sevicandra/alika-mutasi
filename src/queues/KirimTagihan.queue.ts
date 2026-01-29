import Queue from "bull";
import { queueOptions } from "@/config/queue.config";
import { PembayaranJob } from "@/types/Job";

export const kirimTagihanQueue = new Queue<PembayaranJob>("kirim_tagihan", queueOptions);
