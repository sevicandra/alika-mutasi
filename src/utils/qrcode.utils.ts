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
): Promise<{
  imageDataUrl: string;
  width: number;
  height: number;
}> => {
  return new Promise(async (resolve, reject) => {
    try {
      // --- 1. Konfigurasi QR Code ---
      const qrSize = 220; // Ukuran QR Code
      const padding = 10; // Padding antara elemen
      const fontSize = Math.floor(qrSize / 5.5); // 100→18px ✅
      const textHeight = Math.floor(fontSize * 1.5);

      const qrCodeBuffer = await QRCode.toBuffer(url, {
        type: "png",
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: "H",
      });

      const headerWidth = Math.max(
        Math.floor(header.length * (fontSize * 0.6)),
        qrSize
      );

      const footerWidth = Math.max(
        Math.floor(footer.length * (fontSize * 0.65)),
        qrSize
      );

      const textWidth = Math.max(headerWidth, footerWidth);

      // FIX #3: SVG dengan width dan height yang benar
      const topTextSvg = Buffer.from(`
      <svg width="${textWidth}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .text-label {
            font-family: Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: #000000;
          }
        </style>
        <text x="0" y="${textHeight * 0.7}" class="text-label">${header}</text>
      </svg>
    `);

      const bottomTextSvg = Buffer.from(`
      <svg width="${textWidth}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .text-label {
            font-family: Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: #000000;
          }
        </style>
        <text x="0" y="${textHeight * 0.7}" class="text-label">${footer}</text>
      </svg>
    `);

      const finalWidth = Math.max(qrSize, textWidth) + padding * 2;
      const finalHeight =
        textHeight + padding + qrSize + padding + textHeight + padding;

      const baseImage = await sharp({
        create: {
          width: finalWidth,
          height: finalHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .png()
        .toBuffer();

      const qrLeft = padding;
      const textLeft = Math.floor((finalWidth - textWidth) / 2);

      const finalImageBuffer = await sharp(baseImage)
        .composite([
          // Top text (centered)
          {
            input: topTextSvg,
            top: padding,
            left: textLeft,
          },
          // QR Code (left)
          {
            input: qrCodeBuffer,
            top: textHeight + padding * 2,
            left: qrLeft,
          },
          // Bottom text (centered)
          {
            input: bottomTextSvg,
            top: textHeight + qrSize + padding * 2,
            left: textLeft,
          },
        ])
        .png()
        .toBuffer();

      const base64String = finalImageBuffer.toString("base64");

      // Buat string Data URL lengkap
      const dataUrl = `data:image/png;base64,${base64String}`;

      resolve({
        imageDataUrl: dataUrl,
        width: finalWidth,
        height: finalHeight,
      });
    } catch (error) {
      reject(error);
    }
  });
};
