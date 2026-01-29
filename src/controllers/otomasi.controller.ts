import moment from "moment-timezone";
import { Op } from "sequelize";
import { ApproveMutasi } from "@/services/approveDataKeluarga.service";
import logger from "@/utils/Logger.utils";
import { PegawaiMutasi, sequelize } from "@/models";

export const approveMutasi = async () => {
  const t = await sequelize.transaction();
  try {
    const today = moment().format("YYYY-MM-DD");

    const data = await PegawaiMutasi.findAll({
      where: {
        status: "PENDING_APROVAL",
      },
      include: [
        {
          required: true,
          association: "SuratKeputusan",
          include: [
            {
              required: true,
              association: "Timeline",
              where: {
                tanggal: {
                  [Op.lt]: today,
                },
              },
            },
          ],
        },
        {
          association: "TanggunganDewasa",
        },
        {
          association: "TanggunganInvant",
        },
        {
          association: "Art",
        },
        {
          association: "KantorAsal",
          include: [
            {
              association: "Kota",
            },
          ],
        },
        {
          association: "KantorTujuan",
          include: [
            {
              association: "Kota",
            },
          ],
        },
      ],
      transaction: t,
    });

    await ApproveMutasi.addBatchJob(
      data.map((item) => item.id),
      t
    );
    await t.commit();
  } catch (error) {
    logger.error("error approve mutasi", error);
    await t.rollback();
  }
};
