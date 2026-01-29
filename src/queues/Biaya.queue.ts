import Queue from "bull";
import { queueOptions } from "@/config/queue.config";
import { BiayaJob } from "@/types/Job";

export const biayaQueue = new Queue<BiayaJob>("biaya", queueOptions);
