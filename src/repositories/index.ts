import { DataSanggahRepository } from "@/repositories/data-sanggah";
import { DokumenTerminRepository } from "@/repositories/dokumen-termin";
import { FaqRepository } from "@/repositories/faq";
import { KeluargaRepository } from "@/repositories/keluarga";
import { MonitoringTagihanRepository } from "@/repositories/monitoring-tagihan";
import { PayrollRepository } from "@/repositories/payroll";
import { PayrollCounterRepository } from "@/repositories/payroll-counter";
import { PegawaiMutasiRepository } from "@/repositories/pegawai-mutasi";
import { PembayaranLogRepository } from "@/repositories/pembayaran-log";
import { PerubahanKeluargaRepository } from "@/repositories/perubahan-keluarga";
import { RefBarangRepository } from "@/repositories/ref-barang";
import { RefDaratRepository } from "@/repositories/ref-darat";
import { RefGolonganRepository } from "@/repositories/ref-golongan";
import { RefHubunganKeluargaRepository } from "@/repositories/ref-hubungan-keluarga";
import { RefKantorRepository } from "@/repositories/ref-kantor";
import { RefKapalRepository } from "@/repositories/ref-kapal";
import { RefKotaRepository } from "@/repositories/ref-kota";
import { RefPejabatRepository } from "@/repositories/ref-pejabat";
import { RefPesawatRepository } from "@/repositories/ref-pesawat";
import { RefProvinsiRepository } from "@/repositories/ref-provinsi";
import { RefTarifRepository } from "@/repositories/ref-tarif";
import { RefTerminRepository } from "@/repositories/ref-termin";
import { RefTimelineRepository } from "@/repositories/ref-timeline";
import { RefUangHarianRepository } from "@/repositories/ref-uang-harian";
import { RekeningRepository } from "@/repositories/rekening";
import { RincianBiayaRepository } from "@/repositories/rincian-biaya";
import { SanggahRepository } from "@/repositories/sanggah";
import { SpdCounterRepository } from "@/repositories/spd-counter";
import { SuratKeputusanRepository } from "@/repositories/surat-keputusan";
import { TerminRepository } from "@/repositories/termin";
import { TicketCounterRepository } from "@/repositories/ticket-counter";
import { TimelineRepository } from "@/repositories/timeline";
import { TteDokumenRepository } from "@/repositories/tte-dokumen";

const DataSanggah = new DataSanggahRepository();
const DokumenTermin = new DokumenTerminRepository();
const Faq = new FaqRepository();
const Keluarga = new KeluargaRepository();
const MonitoringTagihan = new MonitoringTagihanRepository();
const PayrollCounter = new PayrollCounterRepository();
const Payroll = new PayrollRepository();
const PegawaiMutasi = new PegawaiMutasiRepository();
const PembayaranLog = new PembayaranLogRepository();
const PerubahanKeluarga = new PerubahanKeluargaRepository();
const RefBarang = new RefBarangRepository();
const RefDarat = new RefDaratRepository();
const RefGolongan = new RefGolonganRepository();
const RefHubunganKeluarga = new RefHubunganKeluargaRepository();
const RefKantor = new RefKantorRepository();
const RefKapal = new RefKapalRepository();
const RefKota = new RefKotaRepository();
const RefPejabat = new RefPejabatRepository();
const RefPesawat = new RefPesawatRepository();
const RefProvinsi = new RefProvinsiRepository();
const RefTarif = new RefTarifRepository();
const RefTermin = new RefTerminRepository();
const RefTimeline = new RefTimelineRepository();
const RefUangHarian = new RefUangHarianRepository();
const Rekening = new RekeningRepository();
const RincianBiaya = new RincianBiayaRepository();
const Sanggah = new SanggahRepository();
const SpdCounter = new SpdCounterRepository();
const SuratKeputusan = new SuratKeputusanRepository();
const Termin = new TerminRepository();
const TicketCounter = new TicketCounterRepository();
const Timeline = new TimelineRepository();
const TteDokumen = new TteDokumenRepository();

export {
  DataSanggah,
  DokumenTermin,
  Faq,
  Keluarga,
  MonitoringTagihan,
  PayrollCounter,
  Payroll,
  PegawaiMutasi,
  PembayaranLog,
  PerubahanKeluarga,
  RefBarang,
  RefDarat,
  RefGolongan,
  RefHubunganKeluarga,
  RefKantor,
  RefKapal,
  RefKota,
  RefPejabat,
  RefPesawat,
  RefProvinsi,
  RefTarif,
  RefTermin,
  RefTimeline,
  RefUangHarian,
  Rekening,
  RincianBiaya,
  Sanggah,
  SpdCounter,
  SuratKeputusan,
  Termin,
  TicketCounter,
  Timeline,
  TteDokumen,
};
