import { Transaction } from "sequelize";
import { TicketCounter } from "@/models";
import { BaseRepository } from "./base-repository";

export class TicketCounterRepository extends BaseRepository<TicketCounter> {
  constructor() {
    super(TicketCounter);
  }

  private getYearMonth() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYYMM
  }

  async getCounter(t: Transaction) {
    const yearMonth = this.getYearMonth();
    const [counter] = await TicketCounter.findOrCreate({
      where: { year_month: yearMonth },
      transaction: t,
    });

    counter.last_number += 1;
    await counter.save({ transaction: t });
    return counter;
  }
}

export type TicketCounterType = TicketCounter;