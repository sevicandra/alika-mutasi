import { RefKantor } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefKantorRepository extends BaseRepository<RefKantor> {
  constructor() {
    super(RefKantor);
  }
}
