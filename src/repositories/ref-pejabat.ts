import { RefPejabat } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefPejabatRepository extends BaseRepository<RefPejabat> {
  constructor() {
    super(RefPejabat);
  }
}
