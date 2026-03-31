import { DataSanggahRepository, DataSanggahType } from "@/repositories/data-sanggah";
import { DokumenTerminRepository, DokumenTerminType } from "@/repositories/dokumen-termin";
import { FaqRepository, FaqType } from "@/repositories/faq";
import { KeluargaRepository, KeluargaType } from "@/repositories/keluarga";
import {
  MonitoringTagihanRepository,
  MonitoringTagihanType,
} from "@/repositories/monitoring-tagihan";
import { PayrollRepository, PayrollType } from "@/repositories/payroll";
import { PayrollCounterRepository, PayrollCounterType } from "@/repositories/payroll-counter";
import { PegawaiMutasiRepository, PegawaiMutasiType } from "@/repositories/pegawai-mutasi";
import { PembayaranLogRepository, PembayaranLogType } from "@/repositories/pembayaran-log";
import {
  PerubahanKeluargaRepository,
  PerubahanKeluargaType,
} from "@/repositories/perubahan-keluarga";
import { RefBarangRepository, RefBarangType } from "@/repositories/ref-barang";
import { RefDaratRepository, RefDaratType } from "@/repositories/ref-darat";
import { RefGolonganRepository, RefGolonganType } from "@/repositories/ref-golongan";
import {
  RefHubunganKeluargaRepository,
  RefHubunganKeluargaType,
} from "@/repositories/ref-hubungan-keluarga";
import { RefKantorRepository, RefKantorType } from "@/repositories/ref-kantor";
import { RefKapalRepository, RefKapalType } from "@/repositories/ref-kapal";
import { RefKotaRepository, RefKotaType } from "@/repositories/ref-kota";
import { RefPejabatRepository, RefPejabatType } from "@/repositories/ref-pejabat";
import { RefPesawatRepository, RefPesawatType } from "@/repositories/ref-pesawat";
import { RefProvinsiRepository, RefProvinsiType } from "@/repositories/ref-provinsi";
import { RefTarifRepository, RefTarifType } from "@/repositories/ref-tarif";
import { RefTerminRepository, RefTerminType } from "@/repositories/ref-termin";
import { RefTimelineRepository, RefTimelineType } from "@/repositories/ref-timeline";
import { RefUangHarianRepository, RefUangHarianType } from "@/repositories/ref-uang-harian";
import { RekeningRepository, RekeningType } from "@/repositories/rekening";
import { RincianBiayaRepository, RincianBiayaType } from "@/repositories/rincian-biaya";
import { SanggahRepository, SanggahType } from "@/repositories/sanggah";
import { SpdCounterRepository, SpdCounterType } from "@/repositories/spd-counter";
import { SuratKeputusanRepository, SuratKeputusanType } from "@/repositories/surat-keputusan";
import { TerminRepository, TerminType } from "@/repositories/termin";
import { TicketCounterRepository, TicketCounterType } from "@/repositories/ticket-counter";
import { TimelineRepository, TimelineType } from "@/repositories/timeline";
import { TteDokumenRepository, TteDokumenType } from "@/repositories/tte-dokumen";

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

export type {
  DataSanggahType,
  DokumenTerminType,
  FaqType,
  KeluargaType,
  MonitoringTagihanType,
  PayrollCounterType,
  PayrollType,
  PegawaiMutasiType,
  PembayaranLogType,
  PerubahanKeluargaType,
  RefBarangType,
  RefDaratType,
  RefGolonganType,
  RefHubunganKeluargaType,
  RefKantorType,
  RefKapalType,
  RefKotaType,
  RefPejabatType,
  RefPesawatType,
  RefProvinsiType,
  RefTarifType,
  RefTerminType,
  RefTimelineType,
  RefUangHarianType,
  RekeningType,
  RincianBiayaType,
  SanggahType,
  SpdCounterType,
  SuratKeputusanType,
  TerminType,
  TicketCounterType,
  TimelineType,
  TteDokumenType,
};
