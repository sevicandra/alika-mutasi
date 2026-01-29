import { Transaction } from "sequelize";
import { Op } from "sequelize";
import { Sanggah } from "@/models";
import { TicketCounter } from "@/repositories";
import { BaseRepository } from "./base-repository";

export class SanggahRepository extends BaseRepository<Sanggah> {
  constructor() {
    super(Sanggah);
  }

  async getSanggah(mutasiId: string, t: Transaction) {
    const data = await this.findOne({
      where: {
        pegawai_id: mutasiId,
        status: {
          [Op.ne]: "REVIEWED",
        },
      },
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          include: [
            {
              association: "SuratKeputusan",
              attributes: ["nomor"],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!data) {
      const counter = await TicketCounter.getCounter(t);
      const sanggah = await this.create(
        {
          pegawai_id: mutasiId,
          ticket_number: `SGH-${counter.year_month}-${String(counter.last_number).padStart(4, "0")}`,
          status: "DRAFT",
        },
        {
          transaction: t,
        }
      );
      await sanggah.reload({
        include: [
          {
            association: "Pegawai",
            attributes: ["id", "nama", "nip"],
            include: [
              {
                association: "SuratKeputusan",
                attributes: ["nomor"],
              },
            ],
          },
        ],
        transaction: t,
      });
      return sanggah;
    } else {
      return data;
    }
  }
}
