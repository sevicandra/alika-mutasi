import { MonitoringTagihan } from "@/models";
import { BaseRepository } from "./base-repository";

export class MonitoringTagihanRepository extends BaseRepository<MonitoringTagihan> {
  constructor() {
    super(MonitoringTagihan);
  }
}
