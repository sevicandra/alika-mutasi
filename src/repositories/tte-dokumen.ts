import { TteDokumen } from "@/models";
import { BaseRepository } from "./base-repository";

export class TteDokumenRepository extends BaseRepository<TteDokumen> {
  constructor() {
    super(TteDokumen);
  }
}

export type TteDokumenType = TteDokumen;
