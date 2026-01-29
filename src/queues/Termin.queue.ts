import Queue from "bull";
import { queueOptions } from "@/config/queue.config";
import { TerminJob } from "@/types/Job";

export const terminQueue = new Queue<TerminJob>("termin", queueOptions);
