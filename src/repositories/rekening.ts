import { Rekening } from "@/models";
import { BaseRepository } from "./base-repository";

export class RekeningRepository extends BaseRepository<Rekening> {
  constructor() {
    super(Rekening);
  }
}
