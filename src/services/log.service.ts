import { PembayaranLog } from "@/models";
import { PengajuanSanggah, ReviewSanggah } from "@/types/pembayaranLog";
import { Transaction } from "sequelize";

export class Logger {
  static async GeneralAction({
    pegawai_id,
    actor_nip,
    actor_role,
    action,
    description,
    transaction,
  }: {
    pegawai_id: string;
    actor_nip: string | null;
    actor_role: string;
    action: string;
    description: string | null;
    transaction?: Transaction;
  }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await PembayaranLog.create(
          {
            pegawai_id,
            actor_nip,
            actor_role,
            action,
            description,
            action_type: "GENERAL_ACTION",
          },
          {
            transaction,
          }
        );

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async SanggahanDiajukan({
    pegawai_id,
    actor_nip,
    action,
    description,
    payload,
    transaction,
  }: {
    pegawai_id: string;
    actor_nip: string | null;
    action: string;
    description: string | null;
    payload: PengajuanSanggah[];
    transaction?: Transaction;
  }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await PembayaranLog.create(
          {
            pegawai_id,
            actor_nip,
            actor_role: "PEGAWAI",
            action,
            action_type: "SANGGAHAN_DIAJUKAN",
            description,
            payload: payload,
          },
          {
            transaction,
          }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async SanggahanReview({
    pegawai_id,
    actor_nip,
    action,
    description,
    payload,
    transaction,
  }: {
    pegawai_id: string;
    actor_nip: string | null;
    action: string;
    description: string | null;
    payload: ReviewSanggah[];
    transaction?: Transaction;
  }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await PembayaranLog.create(
          {
            pegawai_id,
            actor_nip,
            actor_role: "SDM",
            action,
            action_type: "SANGGAHAN_DIREVIEW",
            description,
            payload: payload,
          },
          {
            transaction,
          }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async BatchGeneralAction({
    pegawai_ids,
    actor_nip,
    actor_role,
    action,
    description,
    transaction,
  }: {
    pegawai_ids: string[];
    actor_nip: string | null;
    actor_role: string;
    action: string;
    description: string | null;
    transaction?: Transaction;
  }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await PembayaranLog.bulkCreate(
          pegawai_ids.map((pegawai_id) => ({
            pegawai_id,
            actor_nip,
            actor_role,
            action,
            description,
            action_type: "GENERAL_ACTION" as "GENERAL_ACTION" | "SANGGAHAN_DIAJUKAN" | "SANGGAHAN_DIREVIEW",
            payload: null,
          })),
          {
            transaction,
          }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
