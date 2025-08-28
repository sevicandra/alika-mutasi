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
      // --- 1. Konfigurasi QR Code ---
      const qrSize = 220; // Ukuran QR Code
      const padding = 10; // Padding antara elemen
      const textHeight = 40; // Perkiraan tinggi untuk setiap baris teks

      const qrCodeBuffer = await QRCode.toBuffer(url, {
        type: "png",
        width: qrSize,
        margin: 0,
        errorCorrectionLevel: "H",
      });

      // --- 2. Buat Teks sebagai SVG (diubah menjadi Buffer) ---
      const topTextSvg = Buffer.from(`
      <svg width="100%" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
        <text
          y="50%"
          text-anchor="start"
          dy=".3em"
          font-family="Arial, sans-serif"
          font-size="18"
          font-weight="normal"
          fill="#000">
          ${header}
        </text>
      </svg>
    `);
      const bottomTextSvg = Buffer.from(`
      <svg width="100%" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
        <text
          y="50%"
          text-anchor="start"
          dy=".3em"
          font-family="Arial, sans-serif"
          font-size="20"
          font-weight="normal"
          fill="#000">
          ${footer}
        </text>
      </svg>
    `);
      const estimatedTextWidth = Math.max(header.length * 10, footer.length * 12);
      const finalWidth = Math.max(qrSize, estimatedTextWidth) + padding * 2;
      const finalHeight = textHeight + qrSize + textHeight + padding * 3;

      const finalImageBuffer = await sharp({
        create: {
          width: finalWidth,
          height: finalHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          // Tempelkan teks atas
          { input: topTextSvg, top: 10, left: 0 },
          // Tempelkan QR Code
          {
            input: qrCodeBuffer,
            top: textHeight + padding,
            left: 0,
          },
          // Tempelkan teks bawah
          { input: bottomTextSvg, top: textHeight + qrSize + padding * 2, left: 0 },
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
