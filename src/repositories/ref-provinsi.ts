import { RefProvinsi } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefProvinsiRepository extends BaseRepository<RefProvinsi> {
  constructor() {
    super(RefProvinsi);
  }
}

export type RefProvinsiType = RefProvinsi;