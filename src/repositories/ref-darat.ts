import { RefDarat } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefDaratRepository extends BaseRepository<RefDarat> {
  constructor() {
    super(RefDarat);
  }
}
