import QRCode from "qrcode";
import sharp from "sharp";
export const generateQRCode = async (url: string) => {
  const qrBlob = await QRCode.toDataURL(url, {
    type: "image/png",
    margin: 0,
    errorCorrectionLevel: "H",
  });

  return qrBlob;
};

export const generateQRCodeWithText = async (
  url: string,
  header: string,
  footer: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // --- 1. Konfigurasi ---
      const width = 220;
      const height = 300;
      const qrSize = 220;

      const qrCodeBuffer = await QRCode.toBuffer(url, {
        type: "png",
        width: qrSize,
        margin: 0,
        errorCorrectionLevel: "H",
      });

      // --- 3. Buat Teks sebagai SVG (diubah menjadi Buffer) ---
      const topTextSvg = Buffer.from(`
      <svg width="${width}" height="40">
        <text
          y="50%"
          text-anchor="start"
          dy=".3em"
          font-family="Arial, sans-serif"
          font-size="18px"
          font-weight="bold"
          fill="#000">
          ${header}
        </text>
      </svg>
    `);
      const bottomTextSvg = Buffer.from(`
      <svg width="${width}" height="40">
        <text
          y="50%"
          text-anchor="start"
          dy=".3em"
          font-family="Arial, sans-serif"
          font-size="20px"
          font-weight="bold"
          fill="#000">
          ${footer}
        </text>
      </svg>
    `);
      // --- 4. Buat gambar dasar dan gabungkan semuanya ---
      const finalImageBuffer = await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          // Tempelkan teks atas
          { input: topTextSvg, top: 10, left: 0 },
          // Tempelkan QR Code di tengah
          {
            input: qrCodeBuffer,
            top: 45,
            left: 0,
          },
          // Tempelkan teks bawah
          { input: bottomTextSvg, top: 40 + qrSize + 10, left: 0 },
        ])
        .png() // Tentukan format output
        .toBuffer(); // Hasilkan sebagai buffer

      const base64String = finalImageBuffer.toString("base64");

      // Buat string Data URL lengkap
      const dataUrl = `data:image/png;base64,${base64String}`;
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
};
