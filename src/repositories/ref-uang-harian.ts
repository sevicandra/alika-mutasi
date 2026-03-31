import { RefUangHarian } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefUangHarianRepository extends BaseRepository<RefUangHarian> {
  constructor() {
    super(RefUangHarian);
  }
}

export type RefUangHarianType = RefUangHarian;