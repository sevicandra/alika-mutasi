import { PerubahanKeluarga } from "@/models";
import { BaseRepository } from "./base-repository";

export class PerubahanKeluargaRepository extends BaseRepository<PerubahanKeluarga> {
  constructor() {
    super(PerubahanKeluarga);
  }
}

export type PerubahanKeluargaType = PerubahanKeluarga;