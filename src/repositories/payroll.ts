import { Payroll } from "@/models";
import { BaseRepository } from "./base-repository";

export class PayrollRepository extends BaseRepository<Payroll> {
  constructor() {
    super(Payroll);
  }
}
