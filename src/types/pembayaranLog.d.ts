interface PengajuanSanggahAdd {
  action: "ADD";
  data: {
    // This 'data' structure is specific to 'add' action
    nama: {
      new: string;
    };
    nik: {
      new: string;
    };
    hubungan: {
      new: string;
    };
    tanggal_lahir: {
      new: string;
    };
    pekerjaan: {
      new: string;
    };
    status: {
      new: string;
    };
  };
  catatan: string;
  file: string;
}

interface PengajuanSanggahEdit {
  id: string;
  action: "EDIT";
  nama: string;
  data: {
    // This 'data' structure is specific to 'edit' action
    nama?: {
      old: string | undefined;
      new: string;
    };
    nik?: {
      old: string | undefined;
      new: string;
    };
    hubungan?: {
      old: string | undefined;
      new: string;
    };
    tanggal_lahir?: {
      old: string | undefined;
      new: string;
    };
    pekerjaan?: {
      old: string | undefined;
      new: string;
    };
    status?: {
      old: string | undefined;
      new: string;
    };
  };
  catatan: string;
  file?: string;
}

interface PengajuanSanggahRemove {
  id: string;
  nama: string;
  action: "REMOVE";
  catatan: string;
}

interface ReviewSanggahAdd {
  action: "ADD";
  data: {
    nama: {
      new: string;
    };
    nik: {
      new: string;
    };
    hubungan: {
      new: string;
    };
    tanggal_lahir: {
      new: string;
    };
    pekerjaan: {
      new: string;
    };
    status: {
      new: string;
    };
  };
  catatan: string;
  file: string;
  confrimation: boolean;
}

interface ReviewSanggahEdit {
  id: string;
  action: "EDIT";
  nama: string;
  data: {
    // This 'data' structure is specific to 'edit' action
    nama?: {
      old: string | undefined;
      new: string;
    };
    nik?: {
      old: string | undefined;
      new: string;
    };
    hubungan?: {
      old: string | undefined;
      new: string;
    };
    tanggal_lahir?: {
      old: string | undefined;
      new: string;
    };
    pekerjaan?: {
      old: string | undefined;
      new: string;
    };
    status?: {
      old: string | undefined;
      new: string;
    };
  };
  catatan: string;
  file?: string;
  confrimation: boolean;
}

interface ReviewSanggahRemove {
  id: string;
  nama: string;
  action: "REMOVE";
  catatan: string;
  confrimation: boolean;
}

export type PengajuanSanggah = // Union type for different PengajuanSanggah actions
  PengajuanSanggahAdd | PengajuanSanggahEdit | PengajuanSanggahRemove;
export type ReviewSanggah = ReviewSanggahAdd | ReviewSanggahEdit | ReviewSanggahRemove; // Union type for different ReviewSanggah actions

interface GeneralActionAttributes {
  action_type: "GENERAL_ACTION";
  payload: null;
}
interface SanggahanDiajukanAttributes {
  action_type: "SANGGAHAN_DIAJUKAN";
  payload: PengajuanSanggah[];
}
interface SanggahanDireviewAttributes {
  action_type: "SANGGAHAN_DIREVIEW";
  payload: ReviewSanggah[];
}

interface PembayaranLogBase {
  id: string;
  pegawai_id: string;
  actor_nip: string | null;
  actor_role: string;
  action: string;
  description: string | null;
  created_at: Date;
}

export type PembayaranLogAttributes = PembayaranLogBase & // Intersection type to combine base attributes with specific action types
  (GeneralActionAttributes | SanggahanDiajukanAttributes | SanggahanDireviewAttributes);
