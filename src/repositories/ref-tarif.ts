import { RefTarif } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefTarifRepository extends BaseRepository<RefTarif> {
  constructor() {
    super(RefTarif);
  }
}
