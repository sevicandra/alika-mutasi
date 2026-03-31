import { Transaction } from "sequelize";
import { SpdCounter } from "@/models";
import { BaseRepository } from "./base-repository";

export class SpdCounterRepository extends BaseRepository<SpdCounter> {
  constructor() {
    super(SpdCounter);
  }
  async getCounter(t: Transaction) {
    const [counter] = await SpdCounter.findOrCreate({
      where: { year: `${new Date().getFullYear()}` },
      defaults: {
        ext: "KN.122",
      },
      transaction: t,
    });

    counter.last_number += 1;
    await counter.save({ transaction: t });
    return counter;
  }
}

export type SpdCounterType = SpdCounter;