import { queueOptions } from "@/config/queue.config";
import Queue from "bull";
import { BiayaJob } from "@/types/Job";

export const biayaQueue = new Queue<BiayaJob>("biaya", queueOptions);
