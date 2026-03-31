import { RefPesawat } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefPesawatRepository extends BaseRepository<RefPesawat> {
  constructor() {
    super(RefPesawat);
  }
}

export type RefPesawatType = RefPesawat;