export interface Kunjungan {
  id: string;
  nama: string;
  tipe: "Lansia";
  detail: string;
  status: string;
  statusType: "success" | "warning" | "info";
  waktu: string;
}

export interface Pasien {
  id: string;
  nama: string;
  tipe: "Lansia";
  detailInfo: string;
  tanggalLahir?: string;
  jenisKelamin?: "L" | "P";
  currentPeriodExam?: any;
}
