import { Op } from "sequelize";
import { DokumenTermin } from "@/models";
import { BaseRepository } from "./base-repository";

export class DokumenTerminRepository extends BaseRepository<DokumenTermin> {
  constructor() {
    super(DokumenTermin);
  }

  async getDokumenPegawai(mutasiId: string, terminId: string, nip: string) {
    return await this.findAll({
      where: {
        termin_id: terminId,
      },
      include: [
        {
          association: "Termin",
          where: {
            pegawai_id: mutasiId,
          },
          include: [
            {
              association: "Pegawai",
              where: {
                nip: nip,
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
      ],
    });
  }

  async getDokumenPegawaiById(mutasiId: string, terminId: string, dokumenId: string, nip: string) {
    return await this.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
      include: [
        {
          association: "Termin",
          where: {
            pegawai_id: mutasiId,
          },
          include: [
            {
              association: "Pegawai",
              where: {
                nip: nip,
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
            },
          ],
        },
      ],
    });
  }

  async getDokumenPegawaiByIdWithSuratKeputusan(
    mutasiId: string,
    terminId: string,
    dokumenId: string,
    nip: string
  ) {
    return await this.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
      include: [
        {
          association: "Termin",
          where: {
            pegawai_id: mutasiId,
          },
          include: [
            {
              association: "Pegawai",
              where: {
                nip: nip,
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
              attributes: ["id", "nip", "status"],
              include: [
                {
                  association: "SuratKeputusan",
                  attributes: ["nomor", "tanggal", "id"],
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async getDokumenPegawaiByIdWithTTE(
    mutasiId: string,
    terminId: string,
    dokumenId: string,
    nip: string
  ) {
    return await this.findOne({
      where: {
        termin_id: terminId,
        id: dokumenId,
      },
      include: [
        {
          association: "Termin",
          where: {
            pegawai_id: mutasiId,
          },
          include: [
            {
              association: "Pegawai",
              where: {
                nip: nip,
                status: {
                  [Op.ne]: "DRAFT",
                },
              },
              attributes: ["id", "nip", "status"],
            },
            {
              association: "TtePegawai",
            },
          ],
        },
      ],
    });
  }
}

export type DokumenTerminType = DokumenTermin;