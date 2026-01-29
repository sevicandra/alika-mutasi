import { RefTimeline } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefTimelineRepository extends BaseRepository<RefTimeline> {
  constructor() {
    super(RefTimeline);
  }
}
