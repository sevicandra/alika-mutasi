import { Keluarga } from "@/models";
import { BaseRepository } from "./base-repository";

export class KeluargaRepository extends BaseRepository<Keluarga> {
  constructor() {
    super(Keluarga);
  }
}
