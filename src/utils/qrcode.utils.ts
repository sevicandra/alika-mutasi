import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

// Registrasi font
try {
  const fontPath = path.join(process.cwd(), "assets", "fonts", "ARIALBD.TTF");
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: "ArialBold" });
  }
} catch (e) {
  console.error("Gagal meregistrasi font ArialBold:", e);
}

// Fungsi pembantu untuk membuat teks menjadi buffer gambar PNG transparan
function createTextBuffer(text: string, width: number, height: number, fontSize: number): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Format font harus sesuai deklarasi font family saat register
  ctx.font = `${fontSize}px "ArialBold", sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.clearRect(0, 0, width, height);
  ctx.fillText(text, width / 2, height / 2);

  return canvas.toBuffer("image/png");
}

export const generateQRCode = async (url: string) => {
  const qrSize = 220;
  const qrBlob = await QRCode.toBuffer(url, {
    type: "png",
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "H",
  });

  const logoPath = path.join(process.cwd(), "assets", "logoAlika.png");
  const logoSize = Math.floor(qrSize * 0.25);

  const logoBuffer = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain" })
    .toBuffer();

  const qrWithLogo = await sharp(qrBlob)
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${qrWithLogo.toString("base64")}`;
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

      const baseQrCodeBuffer = await QRCode.toBuffer(url, {
        type: "png",
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: "H",
      });

      const logoPath = path.join(process.cwd(), "assets", "logoAlika.png");
      const logoSize = Math.floor(qrSize * 0.25);

      const logoBuffer = await sharp(logoPath)
        .resize(logoSize, logoSize, { fit: "contain" })
        .toBuffer();

      const qrCodeBuffer = await sharp(baseQrCodeBuffer)
        .composite([{ input: logoBuffer, gravity: "center" }])
        .png()
        .toBuffer();

      const headerWidth = Math.max(Math.floor(header.length * (fontSize * 0.6)), qrSize);

      const footerWidth = Math.max(Math.floor(footer.length * (fontSize * 0.65)), qrSize);

      const textWidth = Math.max(headerWidth, footerWidth);

      // Gambar Teks Menggunakan Canvas untuk menghindari isu font di OS
      const topTextBuffer = createTextBuffer(header, textWidth, textHeight, fontSize);
      const bottomTextBuffer = createTextBuffer(footer, textWidth, textHeight, fontSize);

      const finalWidth = Math.max(qrSize, textWidth) + padding * 2;
      const finalHeight = textHeight + padding + qrSize + padding + textHeight + padding;

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

      const qrLeft = Math.floor((finalWidth - qrSize) / 2);
      const textLeft = Math.floor((finalWidth - textWidth) / 2);

      const finalImageBuffer = await sharp(baseImage)
        .composite([
          // Top text (centered)
          {
            input: topTextBuffer,
            top: padding,
            left: textLeft,
          },
          // QR Code (centered)
          {
            input: qrCodeBuffer,
            top: textHeight + padding * 2,
            left: qrLeft,
          },
          // Bottom text (centered)
          {
            input: bottomTextBuffer,
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
