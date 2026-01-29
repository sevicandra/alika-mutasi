import { RefKota } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefKotaRepository extends BaseRepository<RefKota> {
  constructor() {
    super(RefKota);
  }
}
