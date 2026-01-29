import { RefKapal } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefKapalRepository extends BaseRepository<RefKapal> {
  constructor() {
    super(RefKapal);
  }
}
