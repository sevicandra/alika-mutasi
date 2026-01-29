export interface PegawaiJob {
  id: string;
}

export interface BiayaJob {
  nip: string;
  agenda?: {
    nomor: string;
    tanggal: string;
  };
  pegawai_id: string;
  faktor_darat?: number;
  faktor_laut?: number;
  faktor_udara?: number;
  asal: string;
  tujuan: string;
  provinsi_tujuan: string;
  jumlah_tanggungan_dewasa?: number;
  jumlah_tanggungan_invant?: number;
  tanggungan_art?: boolean;
  kelas_pesawat?: "EKONOMI" | "BISNIS";
  golongan: "1" | "2" | "3" | "4";
  jumlah_hari?: number;
}

export interface TerminJob {
  type: "UANG_MUKA" | "LUNAS";
  tahun_uang_muka: string;
  tahun_lunas: string;
  pegawai_id: string;
  nominal: number;
}

export interface PembayaranJob {
  dokumen_id: string;
  nik: string;
  passphrase: string;
}
