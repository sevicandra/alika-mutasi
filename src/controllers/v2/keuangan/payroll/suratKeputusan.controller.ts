import { SuratKeputusan } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";
import sequelize from "@/config/db.config";
import exceljs from "exceljs";
import { Payroll, PayrollCounter, Termin } from "@/models";
import { AlikaService } from "@/services/alika.service";
import { Logger } from "@/services/log.service";

export const getAllSuratKeputusan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const jenjang = (req.query.jenjang as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const where: any = {
      status: {
        [Op.ne]: "DRAFT",
      },
    };
    if (search)
      where[Op.or] = [
        {
          nomor: { [Op.like]: `%${search}%` },
        },
        {
          uraian: { [Op.like]: `%${search}%` },
        },
      ];
    if (jenjang) where.jenjang = jenjang.toUpperCase();
    if (status) where.status = status.toLocaleUpperCase();
    const order: any[] = [];
    const sortField = (req.query.sortField as string) || "id";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    order.push([sortField, sortOrder.toUpperCase()]);
    const data = await SuratKeputusan.findAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          association: "Pegawai",
          include: [
            {
              association: "MonitoringTagihan",
            },
          ],
        },
      ],
    });
    const count = await SuratKeputusan.count({
      where,
    });
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data.map((d) => {
        return {
          id: d.id,
          nomor: d.nomor,
          uraian: d.uraian,
          tanggal: d.tanggal,
          tmt: d.tmt,
          jenjang: d.jenjang,
          status: d.status,
          total_tagihan: d.Pegawai.reduce(
            (total, p) => total + p.MonitoringTagihan.total_tagihan,
            0
          ),
        };
      }),
      {
        limit,
        offset,
        count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
      }
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getSuratKeputusanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { SkId } = req.params;
    const data = await SuratKeputusan.findOne({
      where: {
        id: SkId,
        status: {
          [Op.ne]: "DRAFT",
        },
      },
      include: [
        {
          association: "Timeline",
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM pegawai_mutasi WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "jumlah_pegawai",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(monitoring_tagihan.total_tagihan), 0) FROM pegawai_mutasi JOIN monitoring_tagihan ON monitoring_tagihan.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "total_tagihan",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(monitoring_tagihan.total_termin), 0) FROM pegawai_mutasi JOIN monitoring_tagihan ON monitoring_tagihan.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "total_termin",
          ],
          [
            sequelize.literal(
              "(SELECT COALESCE(SUM(monitoring_tagihan.sisa_tagihan), 0) FROM pegawai_mutasi JOIN monitoring_tagihan ON monitoring_tagihan.pegawai_id = pegawai_mutasi.id WHERE pegawai_mutasi.sk_id = SuratKeputusan.id)"
            ),
            "sisa_tagihan",
          ],
        ],
      },
    });

    if (!data) {
      return errorResponse(res, "data tidak ditemukan", null, 404);
    }
    return successResponse(
      res,
      "Berhasil mengambil data surat keputusan",
      data
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const downloadPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const t = await sequelize.transaction();
  try {
    const { nip } = req.user;
    const { SkId } = req.params;
    const {
      terminId,
      tanggal,
    }: {
      terminId: string[];
      tanggal: Date;
    } = req.body;

    if (terminId.length === 0 || !tanggal) {
      return errorResponse(res, "Data tidak lengkap", null, 400);
    }
    const [number] = await PayrollCounter.findOrCreate({
      where: { sk_id: SkId },
      transaction: t,
    });
    const sk = await SuratKeputusan.findOne({
      where: { id: SkId },
      transaction: t,
    });
    if (!sk) {
      return errorResponse(res, "Surat Keputusan tidak ditemukan", null, 404);
    }
    const lastNumber = number.last_number + 1;
    await PayrollCounter.update(
      { last_number: lastNumber },
      { where: { sk_id: SkId }, transaction: t }
    );

    const payrolls = terminId.map((termin) => ({
      termin_id: termin,
      tanggal,
      tahap: "Tahap " + lastNumber,
    }));
    await Payroll.bulkCreate(payrolls, { transaction: t });
    const termin = await Termin.findAll({
      where: {
        id: { [Op.in]: terminId },
        status: "APPROVED_KEU",
      },
      transaction: t,
      include: [
        {
          association: "Pegawai",
          attributes: ["id", "nama", "nip"],
          include: [
            {
              association: "Rekening",
              attributes: ["nama_rekening", "nomor_rekening", "nama_bank"],
            },
          ],
        },
        {
          association: "Ref",
        },
      ],
    });

    const terminBNI = termin.filter(
      (t) =>
        t.Pegawai.Rekening?.nama_bank.toUpperCase() === "BNI" ||
        t.Pegawai.Rekening?.nama_bank.toUpperCase() === "BANK NEGARA INDONESIA"
    );
    const terminNonBNI = termin.filter(
      (t) =>
        t.Pegawai.Rekening?.nama_bank.toUpperCase() !== "BNI" &&
        t.Pegawai.Rekening?.nama_bank.toUpperCase() !== "BANK NEGARA INDONESIA"
    );

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Data Payroll");

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Payroll ${sk.nomor}`;
    titleCell.font = { name: "Arial", size: 11, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("A2:H2");
    const subtitleCell = worksheet.getCell("A2");
    subtitleCell.value = `Tanggal: ${new Date(
      tanggal
    ).toLocaleDateString()} - Tahap: ${lastNumber}`;
    subtitleCell.font = { name: "Arial", size: 11, bold: true };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.addRow([]);
    worksheet.addRow(["BNI"]);

    worksheet.addRow([
      "No",
      "Nomor Rekening",
      "Nama Rekening",
      "Bruto",
      "Pajak",
      "Biaya Admin",
      "Netto",
      "Bank",
    ]);
    worksheet.getCell(`A${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`B${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`C${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`D${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`E${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`F${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`G${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`H${5}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    worksheet.addRows(
      terminBNI.map((t, index) => [
        index + 1,
        t.Pegawai.Rekening?.nomor_rekening || "-",
        t.Pegawai.Rekening?.nama_rekening || "-",
        t.nominal || 0,
        0,
        0,
        t.nominal || 0,
        t.Pegawai.Rekening?.nama_bank || "-",
      ]),
      "i"
    );
    worksheet.addRow(
      [
        "Total",
        "",
        "",
        terminBNI.reduce((total, t) => total + (t.nominal || 0), 0),
        "",
        "",
        terminBNI.reduce((total, t) => total + (t.nominal || 0), 0),
        "",
      ],
      "i"
    );

    worksheet.addRow([]);
    worksheet.addRow(["Non BNI"]);
    worksheet.addRow([
      "No",
      "Nomor Rekening",
      "Nama Rekening",
      "Bruto",
      "Pajak",
      "Biaya Admin",
      "Netto",
      "Bank",
    ]);
    worksheet.getCell(`A${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`B${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`C${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`D${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`E${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`F${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`G${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell(`H${5 + 4 + terminBNI.length}`).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.addRows(
      terminNonBNI.map((t, index) => [
        index + 1,
        t.Pegawai.Rekening?.nomor_rekening || "-",
        t.Pegawai.Rekening?.nama_rekening || "-",
        t.nominal || 0,
        0,
        2900,
        t.nominal - 2900 || 0,
        t.Pegawai.Rekening?.nama_bank || "-",
      ]),
      "i"
    );
    worksheet.addRow(
      [
        "Total",
        "",
        "",
        terminNonBNI.reduce((total, t) => total + (t.nominal || 0), 0),
        "",
        "",
        terminNonBNI.reduce((total, t) => total + (t.nominal - 2900 || 0), 0),
        "",
      ],
      "i"
    );
    worksheet.getColumn("A").width = 5;
    worksheet.getColumn("B").width = 20;
    worksheet.getColumn("C").width = 20;
    worksheet.getColumn("D").width = 15;
    worksheet.getColumn("E").width = 15;
    worksheet.getColumn("F").width = 15;
    worksheet.getColumn("G").width = 15;
    worksheet.getColumn("H").width = 20;

    worksheet.getColumn("D").numFmt = '"Rp "#,##0.00';
    worksheet.getColumn("E").numFmt = '"Rp "#,##0.00';
    worksheet.getColumn("F").numFmt = '"Rp "#,##0.00';
    worksheet.getColumn("G").numFmt = '"Rp "#,##0.00';

    const namaFile = `Payroll_${sk.nomor}_${tanggal}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);
    await workbook.xlsx.write(res);
    res.end();

    for (const p of termin) {
      p.status = "PAID";
      await Logger.GeneralAction({
        pegawai_id: p.Pegawai.id,
        actor_nip: nip,
        actor_role: "KEU",
        action: `Proses Payroll (${p.Ref.nama})`,
        description: `Permohonan pembayaran untuk ${
          p.Pegawai.nama
        } telah disetujui dan akan diproses payroll pada tanggal ${new Date(
          tanggal
        ).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        })}`,
        transaction: t,
      });
      await p.save({ transaction: t });
    }

    await AlikaService.sendBulkPushNotification({
      nip: termin.map((t) => t.Pegawai.nip),
      message: `Permohonan pembayaran mutasi anda akan diproses payroll pada tanggal ${new Date(
        tanggal
      ).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })}`,
    });

    await t.commit();
    return successResponse(res, "Berhasil mengunduh data payroll", null, 200);
  } catch (error: unknown) {
    await t.rollback();
    next(error);
  }
};
