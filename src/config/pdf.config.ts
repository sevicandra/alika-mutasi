import PdfPrinter from "pdfmake";
import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import path from "path";
import { Writable } from "stream";

export default function generatePdf({
  json,
  margin = { top: 1, right: 1, bottom: 1, left: 1 },
  orientation = "portrait",
  fontSize = 11,
}: {
  json: Content;
  margin?: { top: number; right: number; bottom: number; left: number };
  orientation?: "portrait" | "landscape";
  fontSize?: number;
}): Promise<String> {
  return new Promise((resolve, reject) => {
    try {
      const fonts = {
        Arial: {
          normal: path.join(__dirname, "../../assets/fonts/arial/ARIAL.TTF"),
          bold: path.join(__dirname, "../../assets/fonts/arial/ARIALBD.TTF"),
          italics: path.join(__dirname, "../../assets/fonts/arial/ARIALI.TTF"),
          bolditalics: path.join(__dirname, "../../assets/fonts/arial/ARIALBI.TTF"),
        },
      };
      const printer = new PdfPrinter(fonts);
      const docDefinition = <TDocumentDefinitions>{
        version: "1.7",
        subset: "PDF/A-3a",
        tagged: true,
        pageSize: {
          width: 21 * (72 / 2.54),
          height: 33 * (72 / 2.54),
        },
        pageOrientation: orientation,
        pageMargins: [
          margin.left * (72 / 2.54),
          margin.top * (72 / 2.54),
          margin.right * (72 / 2.54),
          margin.bottom * (72 / 2.54),
        ],
        content: json,
        defaultStyle: {
          font: "Arial",
          fontSize: fontSize,
          alignment: "justify",
        },
        footer: [
          {
            columns: [
              {
                image: path.join(__dirname, "../../assets/logoBSrE.png"),
                width: 50,
                alignment: "center",
                fit: [20, 20],
              },
              {
                text: "Dokumen ini telah ditandatangani menggunakan sertifikat elektronik yang diterbitkan oleh Balai Besar Sertifikasi Elektronik (BSrE), BSSN.",
                width: "*",
              },
            ],
            fontSize: 5,
            margin: [40, 0],
          },
        ],
      };
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      const stream = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });
      stream.on("finish", () => {
        resolve(Buffer.concat(chunks).toString("base64"));
      });
      stream.on("error", (err) => {
        reject(err);
      });
      pdfDoc.pipe(stream);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
