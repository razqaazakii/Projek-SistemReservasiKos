// ============================================================
// types/dashboard.ts
// Tipe data untuk fitur Dashboard (Penyewa & Kamar)
// ============================================================

export interface Tenant {
  id: string;
  nama: string;
  nik: string;
  roomId: string;
  roomNumber: string;
  phone: string;
  tanggalMasuk: string;
  biayaSewa: number;
  deposit: number;
  statusBayar: "Lunas" | "Belum Bayar";
  jatuhTempo: string;
  ktpImage?: string;
  catatan?: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  status: "Tersedia" | "Terisi" | "Maintenance";
  floor?: number;
  description?: string;
}
