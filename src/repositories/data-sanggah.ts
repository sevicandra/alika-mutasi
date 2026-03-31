import { Transaction } from "sequelize";
import { NotFoundError } from "@/utils/errors";
import { DataSanggah } from "@/models";
import { Keluarga } from "@/repositories";
import { BaseRepository } from "./base-repository";

export class DataSanggahRepository extends BaseRepository<DataSanggah> {
  constructor() {
    super(DataSanggah);
  }

  async add(data: any, t: Transaction) {
    await this.create(
      {
        sanggah_id: data.id,
        action: "ADD",
        new_value: JSON.parse(
          JSON.stringify({
            nama: {
              new: data.nama,
              old: null,
            },
            nik: {
              new: data.nik,
              old: null,
            },
            hubungan: {
              new: data.hubungan,
              old: null,
            },
            tanggal_lahir: {
              new: data.tanggal_lahir,
              old: null,
            },
            pekerjaan: {
              new: data.pekerjaan,
              old: null,
            },
            status: {
              new: data.status,
              old: null,
            },
          })
        ),
        reason: data.catatan,
        file: data.file,
      },
      {
        transaction: t,
      }
    );
  }

  async edit(keluarga_id: string, data: any, t: Transaction) {
    if (
      data.nama == null &&
      data.nik &&
      data.hubungan &&
      data.tanggal_lahir &&
      data.pekerjaan &&
      data.status
    ) {
      throw new NotFoundError("tidak ada perubahan data");
    }

    const keluarga = await Keluarga.findById(keluarga_id);
    if (!keluarga) {
      throw new NotFoundError("Data Keluarga tidak ditemukan");
    }

    await this.create(
      {
        sanggah_id: data.id,
        action: "EDIT",
        keluarga_id,
        new_value: JSON.parse(
          JSON.stringify({
            nama: data.nama
              ? {
                  new: data.nama,
                  old: keluarga.nama,
                }
              : {},
            nik: data.nik
              ? {
                  new: data.nik,
                  old: keluarga.nik,
                }
              : {},
            hubungan: data.hubungan
              ? {
                  new: data.hubungan,
                  old: keluarga.hubungan,
                }
              : {},
            tanggal_lahir: data.tanggal_lahir
              ? {
                  new: data.tanggal_lahir,
                  old: keluarga.tanggal_lahir,
                }
              : {},
            pekerjaan: data.pekerjaan
              ? {
                  new: data.pekerjaan,
                  old: keluarga.pekerjaan,
                }
              : {},
            status: data.status
              ? {
                  new: data.status,
                  old: keluarga.status,
                }
              : {},
          })
        ),
        file: data.file,
        reason: data.catatan,
      },
      {
        transaction: t,
      }
    );
  }

  async remove(keluarga_id: string, data: any, t: Transaction) {
    const keluarga = await Keluarga.findById(keluarga_id);
    if (!keluarga) {
      throw new NotFoundError("Data Keluarga tidak ditemukan");
    }

    await this.create(
      {
        sanggah_id: data.id,
        action: "REMOVE",
        keluarga_id,
        file: data.file,
        reason: data.catatan,
      },
      {
        transaction: t,
      }
    );
  }
}

export type DataSanggahType = DataSanggah;