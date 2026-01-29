import { Transaction } from "sequelize";
import { Timeline } from "@/models";
import { BaseRepository } from "./base-repository";

export class TimelineRepository extends BaseRepository<Timeline> {
  constructor() {
    super(Timeline);
  }

  async setTimeline(
    SkId: string,
    timeline_sanggah: Date,
    timeline_verifikasi: Date,
    timeline_spm: Date,
    t: Transaction
  ) {
    await Timeline.upsert(
      {
        sk_id: SkId,
        ref_kode: "01",
        tanggal: timeline_sanggah,
      },
      {
        transaction: t,
      }
    );
    await Timeline.upsert(
      {
        sk_id: SkId,
        ref_kode: "02",
        tanggal: timeline_verifikasi,
      },
      {
        transaction: t,
      }
    );
    await Timeline.upsert(
      {
        sk_id: SkId,
        ref_kode: "03",
        tanggal: timeline_spm,
      },
      {
        transaction: t,
      }
    );
  }
}
