import { Transaction } from "sequelize";
import { PayrollCounter } from "@/models";
import { BaseRepository } from "./base-repository";

export class PayrollCounterRepository extends BaseRepository<PayrollCounter> {
  constructor() {
    super(PayrollCounter);
  }

  async getCounter(SkId: string, t: Transaction) {
    const [counter] = await PayrollCounter.findOrCreate({
      where: { sk_id: SkId },
      transaction: t,
    });

    counter.last_number += 1;
    await counter.save({ transaction: t });
    return counter;
  }
}

export type PayrollCounterType = PayrollCounter;