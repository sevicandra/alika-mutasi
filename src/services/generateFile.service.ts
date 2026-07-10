import { PDFDocument } from "pdf-lib";
import { UUID } from "@/utils/uuid.util";
import { appConfig } from "@/config/app.config";
import { PegawaiMutasi, RefPejabat, Termin } from "@/models";
import { minioService } from "./minio-service";
import { PdfService } from "./pdf.service";
import { PdfCoordinateExtractorService } from "./pdfCoordinateExtractor.service";
import { redisService } from "./redis-service";

export class GenerateFileService {
  private static async getPpk(): Promise<RefPejabat> {
    const redisKey = `${appConfig.NAME}:ref:pejabat:ppk`;
    const rute = await redisService.get<RefPejabat>(redisKey);
    if (rute) {
      return rute;
    }
    const refPejabat = await RefPejabat.findOne({
      where: { jenis: "PPK" },
    });
    if (!refPejabat) {
      throw new Error("PPK not found");
    }
    await redisService.setWithTimeout(redisKey, refPejabat, 300);
    return refPejabat;
  }

  private static async getBendahara(): Promise<RefPejabat> {
    const redisKey = `${appConfig.NAME}:ref:pejabat:bendahara`;
    const rute = await redisService.get<RefPejabat>(redisKey);
    if (rute) {
      return rute;
    }
    const refPejabat = await RefPejabat.findOne({
      where: { jenis: "BENDAHARA" },
    });
    if (!refPejabat) {
      throw new Error("Bendahara not found");
    }
    await redisService.setWithTimeout(redisKey, refPejabat, 300);
    return refPejabat;
  }

  static async RincianBiaya({
    pegawai,
    termin,
    agenda,
    doc,
  }: {
    pegawai: PegawaiMutasi;
    termin: Termin;
    agenda: {
      nomor: string;
      tanggal: string;
    };
    doc: {
      jenis: string;
      required: boolean;
      upload: boolean;
      penandatatangan: string[];
    };
  }) {
    const ppk = await this.getPpk();
    const bendahara = await this.getBendahara();
    const pdf = await PdfService.RincianBiaya({
      pegawai,
      ppk,
      bendahara,
      termin,
      agenda,
    });
    const pdfBuffer = Buffer.from(pdf, "base64");
    const coordinates = await PdfCoordinateExtractorService.extractPlaceholderCoordinates(
      pdfBuffer,
      doc.penandatatangan.map((penandatangan) => ({
        jabatan: penandatangan,
        placeholder_text: `##PLACEHOLDER_${penandatangan}##`,
      }))
    );

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const pdfBytes: Uint8Array = await pdfDoc.save();
    const bufferPdf = Buffer.from(pdfBytes);
    const fileName = UUID.v4();
    const filePath = `${pegawai.SuratKeputusan.nomor.replace(
      /\//g,
      "_"
    )}/${pegawai.nip}/${fileName}.pdf`;
    await minioService.uploadFile(bufferPdf, filePath, "application/pdf");

    return {
      termin_id: termin.id,
      file: filePath,
      jenis: doc.jenis,
      required: true,
      uploadable: false,
      penandatangan: coordinates.map((c) => {
        return {
          nama:
            c.jabatan === "PEGAWAI"
              ? pegawai.nama
              : c.jabatan === "PPK"
                ? ppk.nama
                : c.jabatan === "BENDAHARA"
                  ? bendahara.nama
                  : undefined,
          nip:
            c.jabatan === "PEGAWAI"
              ? pegawai.nip
              : c.jabatan === "PPK"
                ? ppk.nip
                : c.jabatan === "BENDAHARA"
                  ? bendahara.nip
                  : undefined,
          jabatan: c.jabatan as "PEGAWAI" | "BENDAHARA" | "PPK",
          koordinat: {
            page: c.page,
            x: c.x * pages[c.page - 1].getWidth() + 2,
            y: pages[c.page - 1].getHeight() - c.y * pages[c.page - 1].getHeight() - 10,
          },
        };
      }),
    };
  }

  static async SPD1({
    pegawai,
    termin,
    agenda,
    doc,
  }: {
    pegawai: PegawaiMutasi;
    termin: Termin;
    agenda: {
      nomor: string;
      tanggal: string;
    };
    doc: {
      jenis: string;
      required: boolean;
      upload: boolean;
      penandatatangan: string[];
    };
  }) {
    const ppk = await this.getPpk();
    const bendahara = await this.getBendahara();
    const pdf = await PdfService.Spd1({
      pegawai,
      ppk,
      agenda,
    });
    const pdfBuffer = Buffer.from(pdf, "base64");
    const coordinates = await PdfCoordinateExtractorService.extractPlaceholderCoordinates(
      pdfBuffer,
      doc.penandatatangan.map((penandatangan) => ({
        jabatan: penandatangan,
        placeholder_text: `##PLACEHOLDER_${penandatangan}##`,
      }))
    );
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const pdfBytes: Uint8Array = await pdfDoc.save();
    const bufferPdf = Buffer.from(pdfBytes);
    const fileName = UUID.v4();
    const filePath = `${pegawai.SuratKeputusan.nomor.replace(
      /\//g,
      "_"
    )}/${pegawai.nip}/${fileName}.pdf`;
    await minioService.uploadFile(bufferPdf, filePath, "application/pdf");
    return {
      termin_id: termin.id,
      file: filePath,
      jenis: doc.jenis,
      required: true,
      uploadable: false,
      penandatangan: coordinates.map((c) => {
        return {
          nama:
            c.jabatan === "PEGAWAI"
              ? pegawai.nama
              : c.jabatan === "PPK"
                ? ppk.nama
                : c.jabatan === "BENDAHARA"
                  ? bendahara.nama
                  : undefined,
          nip:
            c.jabatan === "PEGAWAI"
              ? pegawai.nip
              : c.jabatan === "PPK"
                ? ppk.nip
                : c.jabatan === "BENDAHARA"
                  ? bendahara.nip
                  : undefined,
          jabatan: c.jabatan as
            "PEGAWAI" | "PEJABAT_KANTOR_ASAL" | "PEJABAT_KANTOR_TUJUAN" | "BENDAHARA" | "PPK",
          koordinat: {
            page: c.page,
            x: c.x * pages[c.page - 1].getWidth() + 2,
            y: pages[c.page - 1].getHeight() - c.y * pages[c.page - 1].getHeight() - 10,
          },
        };
      }),
    };
  }

  static async SPD2({
    pegawai,
    termin,
    agenda,
    doc,
  }: {
    pegawai: PegawaiMutasi;
    termin: Termin;
    agenda: {
      nomor: string;
      tanggal: string;
    };
    doc: {
      jenis: string;
      required: boolean;
      upload: boolean;
      penandatatangan: string[];
    };
  }) {
    const ppk = await this.getPpk();
    const bendahara = await this.getBendahara();
    const pdf = await PdfService.Spd2({ pegawai, ppk, agenda });
    const pdfBuffer = Buffer.from(pdf, "base64");
    const coordinates = await PdfCoordinateExtractorService.extractPlaceholderCoordinates(
      pdfBuffer,
      doc.penandatatangan.map((penandatangan) => ({
        jabatan: penandatangan,
        placeholder_text: `##PLACEHOLDER_${penandatangan}##`,
      }))
    );
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const pdfBytes: Uint8Array = await pdfDoc.save();
    const bufferPdf = Buffer.from(pdfBytes);
    const fileName = UUID.v4();
    const filePath = `${pegawai.SuratKeputusan.nomor.replace(
      /\//g,
      "_"
    )}/${pegawai.nip}/${fileName}.pdf`;
    await minioService.uploadFile(bufferPdf, filePath, "application/pdf");
    return {
      termin_id: termin.id,
      file: filePath,
      jenis: doc.jenis,
      required: true,
      uploadable: false,
      penandatangan: coordinates.map((c) => {
        return {
          nama:
            c.jabatan === "PEGAWAI"
              ? pegawai.nama
              : c.jabatan === "PPK"
                ? ppk.nama
                : c.jabatan === "BENDAHARA"
                  ? bendahara.nama
                  : undefined,
          nip:
            c.jabatan === "PEGAWAI"
              ? pegawai.nip
              : c.jabatan === "PPK"
                ? ppk.nip
                : c.jabatan === "BENDAHARA"
                  ? bendahara.nip
                  : undefined,
          jabatan: c.jabatan as
            "PEGAWAI" | "PEJABAT_KANTOR_ASAL" | "PEJABAT_KANTOR_TUJUAN" | "BENDAHARA" | "PPK",
          koordinat: {
            page: c.page,
            x: c.x * pages[c.page - 1].getWidth() + 2,
            y: pages[c.page - 1].getHeight() - c.y * pages[c.page - 1].getHeight() - 10,
          },
        };
      }),
    };
  }

  static async generateFile(
    pegawai: PegawaiMutasi,
    agenda: {
      nomor: string;
      tanggal: string;
    }
  ): Promise<
    {
      termin_id: string;
      file?: string;
      jenis: string;
      required: boolean;
      uploadable: boolean;
      penandatangan: {
        nama?: string;
        nip?: string;
        koordinat: {
          page: number;
          x: number;
          y: number;
        };
        jabatan: "PEGAWAI" | "PEJABAT_KANTOR_ASAL" | "PEJABAT_KANTOR_TUJUAN" | "BENDAHARA" | "PPK";
      }[];
    }[]
  > {
    return new Promise(async (resolve, reject) => {
      const uploadedFiles: string[] = [];
      const files: {
        termin_id: string;
        file?: string;
        jenis: string;
        required: boolean;
        uploadable: boolean;
        penandatangan: {
          nama?: string;
          nip?: string;
          koordinat: {
            page: number;
            x: number;
            y: number;
          };
          jabatan:
            "PEGAWAI" | "PEJABAT_KANTOR_ASAL" | "PEJABAT_KANTOR_TUJUAN" | "BENDAHARA" | "PPK";
        }[];
      }[] = [];

      try {
        for (const termin of pegawai.Termin) {
          const req_doc = termin.Ref.required_doc;
          for (const doc of req_doc) {
            if (doc.jenis === "RINCIAN_BIAYA") {
              const rincianBiaya = await this.RincianBiaya({
                pegawai,
                termin,
                agenda,
                doc,
              });
              files.push(rincianBiaya);
            } else if (doc.jenis === "SPD1") {
              const spd1 = await this.SPD1({
                pegawai,
                termin,
                agenda,
                doc,
              });
              files.push(spd1);
            } else if (doc.jenis === "SPD2") {
              const spd2 = await this.SPD2({
                pegawai,
                termin,
                agenda,
                doc,
              });
              files.push(spd2);
            } else {
              files.push({
                termin_id: termin.id,
                jenis: doc.jenis,
                required: doc.required,
                uploadable: true,
                penandatangan: [
                  {
                    nama: pegawai.nama,
                    nip: pegawai.nip,
                    jabatan: "PEGAWAI",
                    koordinat: {
                      page: 1,
                      x: 10,
                      y: 10,
                    },
                  },
                ],
              });
            }
          }
        }
        resolve(files);
      } catch (error) {
        for (const filePath of uploadedFiles) {
          try {
            await minioService.deleteFile(filePath);
          } catch (deleteError) {
            console.warn(`Gagal menghapus file rollback: ${filePath}`, deleteError);
          }
        }
        reject(error);
      }
    });
  }
}
