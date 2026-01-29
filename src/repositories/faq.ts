import { Transaction } from "sequelize";
import { AuthorizationError, NotFoundError } from "@/utils/errors";
import { Faq } from "@/models";
import { BaseRepository } from "./base-repository";

export class FaqRepository extends BaseRepository<Faq> {
  constructor() {
    super(Faq);
  }

  async publish(id: string, t?: Transaction) {
    const data = await this.findById(id, { transaction: t });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    if (data.status === "PUBLISH") {
      throw new AuthorizationError("Data sudah dipublish");
    }
    data.status = "PUBLISH";
    await data.save({ transaction: t });
  }

  async unPublish(id: string, t?: Transaction) {
    const data = await Faq.findByPk(id, { transaction: t });
    if (!data) {
      throw new NotFoundError("Data not found");
    }
    if (data.status === "DRAFT") {
      throw new AuthorizationError("Data sudah dalam status draft");
    }
    data.status = "DRAFT";
    await data.save({ transaction: t });
  }
}
