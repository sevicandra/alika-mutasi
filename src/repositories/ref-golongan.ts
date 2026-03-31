import { RefGolongan } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefGolonganRepository extends BaseRepository<RefGolongan> {
  constructor() {
    super(RefGolongan);
  }
}

export type RefGolonganType = RefGolongan;