import { Job } from "bull";
import dotenv from "dotenv";
import QRCode from "qrcode";
import { Op } from "sequelize";
import { EsignService } from "@/services/esign.service";
import { minioService } from "@/services/minio-service";
import { appConfig } from "@/config/app.config";
import sequelize from "@/config/db.config";
import { DokumenTermin, Termin } from "@/models";
import { PembayaranJob } from "@/types/Job";

dotenv.config();

/**
 * Checks if all documents for a specific invoice (Termin) have been processed
 * (either SIGNED or FAILED) and updates the final status of the invoice.
 * This function is intended to be called after each document signing attempt.
 *
 * @param {string} dokumenId - The ID of a DokumenTermin that was just processed.
 */
const checkFinalDokumen = async (dokumenId: string) => {
  console.log(`Checking final status for documents related to Dokumen ID: ${dokumenId}`);

  // Start a new, managed transaction for this check to ensure atomicity.
  const t = await sequelize.transaction();
  try {
    // Fetch the document and its termin_id within the transaction
    const initialDokumen = await DokumenTermin.findByPk(dokumenId, {
      transaction: t,
    });

    if (!initialDokumen?.termin_id) {
      console.log(`Invoice (Termin) not found for document ${dokumenId}. No finalization needed.`);
      await t.commit();
      return;
    }

    const terminId = initialDokumen.termin_id;

    // Count all documents for the termin that are expected to have a signature.
    const countsAll = await DokumenTermin.count({
      where: {
        termin_id: terminId,
        file: { [Op.ne]: null },
      },
      include: [
        {
          association: "TtePegawai",
          required: true, // INNER JOIN
        },
      ],
      transaction: t,
    });

    // Count all documents that have been successfully signed.
    const countsSigned = await DokumenTermin.count({
      where: {
        termin_id: terminId,
      },
      include: [
        {
          association: "TtePegawai",
          where: { status: "SIGNED" },
          required: true, // INNER JOIN
        },
      ],
      transaction: t,
    });

    // Count all documents that have failed the signing process.
    const countsFailed = await DokumenTermin.count({
      where: {
        termin_id: terminId,
      },
      include: [
        {
          association: "TtePegawai",
          where: { status: "FAILED" },
          required: true, // INNER JOIN
        },
      ],
      transaction: t,
    });

    // If the number of processed documents (signed + failed) equals the total, we can finalize.
    if (countsAll > 0 && countsAll === countsSigned + countsFailed) {
      if (countsFailed > 0) {
        // If any document failed, the entire invoice is reverted to DRAFT.
        console.log(
          `[FINALIZE-UPDATE] Found failed documents for Termin ${terminId}. Reverting status to DRAFT.`
        );
        await Termin.update({ status: "DRAFT" }, { where: { id: terminId }, transaction: t });
      } else {
        // If all documents were signed successfully, the invoice is ready for approval.
        console.log(
          `[FINALIZE-UPDATE] All documents for Termin ${terminId} are signed. Setting status to WAITING_APPROVAL_SDM.`
        );
        await Termin.update(
          { status: "WAITING_APPROVAL_SDM" },
          { where: { id: terminId }, transaction: t }
        );
      }
      console.log(`[FINALIZE-SUCCESS] Termin ${terminId} has been finalized.`);
    } else {
      console.log(
        `[FINALIZE-INFO] Termin ${terminId} is not yet ready for finalization. Total: ${countsAll}, Signed: ${countsSigned}, Failed: ${countsFailed}.`
      );
    }

    // Commit the transaction if all checks and updates are successful.
    await t.commit();
  } catch (error) {
    // Rollback the transaction in case of any error.
    console.error(
      `[FINALIZE-ERROR] Failed to finalize invoice status for document ${dokumenId}:`,
      error
    );
    await t.rollback();
  }
};

export const processKirim = async (job: Job<PembayaranJob>): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const { dokumen_id, nik, passphrase } = job.data;
    const t = await sequelize.transaction();
    try {
      const dokumen = await DokumenTermin.findByPk(dokumen_id, {
        include: [{ association: "TtePegawai" }],
        transaction: t,
      });

      if (!dokumen || !dokumen.file) {
        throw new Error("Dokumen not found or file is missing.");
      }

      const stream = await minioService.getFile(dokumen.file);
      if (!stream) throw new Error("File stream could not be downloaded from Minio.");
      const blob = new Blob([stream], { type: "application/pdf" });

      const qrCodeUrl = `${appConfig.URL}/public/file/download/pembayaran/${dokumen.id}`;
      const TteBlob = await QRCode.toDataURL(qrCodeUrl, {
        type: "image/png",
        margin: 0,
      });

      const tte = await EsignService.processEsign({
        nik: nik,
        passphrase: passphrase,
        jenis: dokumen.document_type,
        tujuan: "PPK Bagian SDM",
        perihal: "Dokumen Pembayaran Mutasi",
        blob: blob,
        fileName: dokumen.file,
        page: dokumen.TtePegawai.koordinat_qr.page,
        xAxis: dokumen.TtePegawai.koordinat_qr.x + 50,
        yAxis: dokumen.TtePegawai.koordinat_qr.y + 50,
        width: dokumen.TtePegawai.koordinat_qr.x,
        height: dokumen.TtePegawai.koordinat_qr.y,
        imageTTD: await fetch(TteBlob).then((res) => res.blob()),
        imageTTDName: "qrcode.png",
      });

      await minioService.uploadFile(tte.buffer, dokumen.file, "application/pdf");

      dokumen.process = "IDLE";
      dokumen.processed_by = "";
      dokumen.TtePegawai.date = new Date(tte.date || "");
      dokumen.TtePegawai.status = "SIGNED";

      await dokumen.save({ transaction: t });
      await dokumen.TtePegawai.save({ transaction: t });

      await t.commit();
      console.log(`Job for document ${dokumen_id} completed successfully.`);
      resolve();
    } catch (error) {
      await t.rollback(); // Rollback the original transaction on any error.
      console.error(
        `Job failed for document ${dokumen_id}, attempt: ${job.attemptsMade + 1}. Error:`,
        error
      );

      if (job.attemptsMade >= 2) {
        // Max retries reached (0, 1, 2)
        console.log(`Job for document ${dokumen_id} has reached max retries. Marking as FAILED.`);

        // Use a NEW, separate transaction to update the status to FAILED.
        // This is critical because the original transaction 't' has already been rolled back.
        const failureTransaction = await sequelize.transaction();
        try {
          const dokumenToFail = await DokumenTermin.findByPk(dokumen_id, {
            include: [{ association: "TtePegawai" }],
            transaction: failureTransaction,
          });

          if (dokumenToFail) {
            dokumenToFail.process = "IDLE";
            dokumenToFail.processed_by = "";
            dokumenToFail.TtePegawai.date = null;
            dokumenToFail.TtePegawai.status = "FAILED";
            await dokumenToFail.save({ transaction: failureTransaction });
            await dokumenToFail.TtePegawai.save({
              transaction: failureTransaction,
            });
            await failureTransaction.commit();
            console.log(`Successfully marked document ${dokumen_id} as FAILED.`);
          }
        } catch (updateError) {
          console.error(`Could not update document ${dokumen_id} status to FAILED:`, updateError);
          await failureTransaction.rollback();
        }
      }
      reject(error); // Reject the promise to signal job failure to Bull.
    } finally {
      // This will run after commit or rollback, ensuring we always check the final status.
      await checkFinalDokumen(dokumen_id);
    }
  });
};
