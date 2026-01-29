import { Termin } from "@/models";
import { BaseRepository } from "./base-repository";

export class TerminRepository extends BaseRepository<Termin> {
  constructor() {
    super(Termin);
  }
}
