import { RefTermin } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefTerminRepository extends BaseRepository<RefTermin> {
  constructor() {
    super(RefTermin);
  }
}
