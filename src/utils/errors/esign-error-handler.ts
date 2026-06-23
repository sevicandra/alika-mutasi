import logger from "@/utils/Logger.utils";
import { BaseError } from "./base-error";

export class EsignError extends BaseError {
  constructor(message: string, statusCode: number = 502, details?: Record<string, any>) {
    super(message, statusCode, "ESIGN_ERROR", true, details);
    Object.setPrototypeOf(this, EsignError.prototype);
  }
}

const BSRE_ERROR_MAPPING: Record<string, string> = {
  "passphrase salah": "Passphrase yang Anda masukkan salah. Silakan coba lagi.",
  "password salah": "Passphrase yang Anda masukkan salah. Silakan coba lagi.",
  "tidak terdaftar": "NIK/NIP Anda tidak terdaftar di sistem eSign (BSrE).",
  "tidak ditemukan": "NIK/NIP Anda tidak terdaftar di sistem eSign (BSrE).",
  "tidak memiliki sertifikat": "NIK Anda tidak memiliki sertifikat aktif di BSrE.",
  "sertifikat tidak aktif": "Sertifikat elektronik Anda tidak aktif atau sudah kadaluarsa.",
  expired: "Sertifikat elektronik Anda telah kadaluarsa.",
  "sudah ditandatangani": "Dokumen ini sudah ditandatangani sebelumnya.",
  "tidak valid": "Dokumen PDF tidak valid atau rusak.",
};

export function extractErrorMessage(bodyText: string): string {
  if (!bodyText) return "Terjadi kesalahan tidak diketahui pada layanan eSign.";

  try {
    const parsed = JSON.parse(bodyText);
    const message =
      parsed.message || parsed.error || parsed.messageDescription || parsed.description;
    if (message && typeof message === "string") {
      return message;
    }
    if (parsed.errors && typeof parsed.errors === "object") {
      return Object.values(parsed.errors).join(", ");
    }
  } catch {
    // Not JSON
  }

  if (bodyText.includes("<html") || bodyText.includes("<!DOCTYPE")) {
    return "Layanan eSign mengembalikan respon format HTML yang tidak valid (kemungkinan server bermasalah).";
  }

  return bodyText.length > 200 ? bodyText.substring(0, 200) + "..." : bodyText;
}

export function mapFriendlyErrorMessage(rawMessage: string): string {
  const lowercaseMessage = rawMessage.toLowerCase();
  for (const [key, friendlyMsg] of Object.entries(BSRE_ERROR_MAPPING)) {
    if (lowercaseMessage.includes(key)) {
      return friendlyMsg;
    }
  }
  return rawMessage;
}

/**
 * Handles non-OK HTTP responses from the eSign server.
 */
export const handleEsignResponseError = (
  status: number,
  bodyText: string,
  context?: { nik?: string; jenis?: string; nomor?: string }
): EsignError => {
  const rawMessage = extractErrorMessage(bodyText);
  const friendlyMessage = mapFriendlyErrorMessage(rawMessage);

  logger.error("eSign Service Error Response", {
    ...context,
    statusCode: status,
    rawMessage,
    friendlyMessage,
  });

  if (status === 401) {
    return new EsignError("Kredensial client eSign tidak valid (Server Error).", 500);
  }
  if (status === 403) {
    return new EsignError("Akses ke layanan eSign ditolak.", 403);
  }
  if (status === 404) {
    return new EsignError("Endpoint eSign tidak ditemukan.", 502);
  }

  return new EsignError(friendlyMessage, status || 500);
};

/**
 * Handles errors occurring during eSign execution.
 */
export const handleEsignError = (
  error: unknown,
  context?: { nik?: string; jenis?: string; nomor?: string }
): BaseError => {
  if (error instanceof BaseError) {
    return error;
  }

  logger.error("eSign unexpected error occurred", {
    ...context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return new EsignError(
    `Gagal memproses eSign: ${error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui"}`,
    500,
    error instanceof Error ? { original: error.message } : undefined
  );
};
