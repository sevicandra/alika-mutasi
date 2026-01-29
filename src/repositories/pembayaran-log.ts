import { PembayaranLog } from "@/models";
import { BaseRepository } from "./base-repository";

export class PembayaranLogRepository extends BaseRepository<PembayaranLog> {
  constructor() {
    super(PembayaranLog);
  }
}
