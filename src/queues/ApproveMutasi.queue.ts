import { queueOptions } from "@/config/queue.config";
import Queue from "bull";
import { BiayaJob } from "@/types/Job";

export const approveMutasiQueue = new Queue<BiayaJob>("approve_mutasi", queueOptions);
