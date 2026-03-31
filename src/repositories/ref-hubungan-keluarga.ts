import { RefHubunganKeluarga } from "@/models";
import { BaseRepository } from "./base-repository";

export class RefHubunganKeluargaRepository extends BaseRepository<RefHubunganKeluarga> {
  constructor() {
    super(RefHubunganKeluarga);
  }
}

export type RefHubunganKeluargaType = RefHubunganKeluarga;