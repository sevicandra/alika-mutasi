import Queue from "bull";
import { queueOptions } from "@/config/queue.config";
import { BiayaJob } from "@/types/Job";

export const approveMutasiQueue = new Queue<BiayaJob>("approve_mutasi", queueOptions);
