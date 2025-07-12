// src/services/pdfCoordinateExtractor.service.ts
import PDFParser from "pdf2json";
import { Buffer } from "buffer";

export class PdfCoordinateExtractorService {
  /**
   * Extracts the X, Y coordinates and page number of specified placeholder texts within a PDF.
   * Coordinates are based on pdf2json's internal scale.
   * @param pdfBuffer The PDF content as a Buffer.
   * @param placeholders Array of { jabatan, placeholder_text } to search for.
   * @returns Array of matching coordinates and page info.
   */
  static async extractPlaceholderCoordinates(
    pdfBuffer: Buffer,
    placeholders: { jabatan: string; placeholder_text: string }[]
  ): Promise<
    {
      jabatan: string;
      x: number;
      y: number;
      page: number;
      width: number;
    }[]
  > {
    const coordinates: {
      jabatan: string;
      x: number;
      y: number;
      page: number;
      width: number;
    }[] = [];

    const pdfParser = new PDFParser();

    return new Promise((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const pages = pdfData.Pages;

        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          const page = pages[pageIndex];
          for (const textItem of page.Texts) {
            const text = decodeURIComponent(textItem.R[0].T);

            for (const placeholder of placeholders) {
              if (text.includes(placeholder.placeholder_text)) {
                coordinates.push({
                  jabatan: placeholder.jabatan,
                  x: textItem.x/page.Width,
                  y: textItem.y/page.Height,
                  page: pageIndex + 1,
                  width: textItem.w,
                });
              }
            }
          }
        }
        resolve(coordinates);
      });
      pdfParser.parseBuffer(pdfBuffer);
    });
  }
}
