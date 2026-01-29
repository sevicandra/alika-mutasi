import { RincianBiaya } from "@/models";
import { BaseRepository } from "./base-repository";

export class RincianBiayaRepository extends BaseRepository<RincianBiaya> {
  constructor() {
    super(RincianBiaya);
  }
}
