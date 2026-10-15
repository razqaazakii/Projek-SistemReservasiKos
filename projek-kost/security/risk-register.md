# Register Risiko & Rencana Kontrol: R-Stay

## 1. Pendahuluan
Dokumen ini memetakan lima risiko keamanan prioritas pada aplikasi **R-Stay** berdasarkan pemodelan STRIDE (`threat-model.md`). Risiko dinilai dari aspek Kerahasiaan, Integritas, dan Ketersediaan (CIA).

## 2. Matriks Penilaian Risiko
* **Kemungkinan:** Tinggi (mudah dieksploitasi), Sedang (butuh kondisi khusus), Rendah (sulit dieksploitasi).
* **Dampak:** Tinggi (kerugian finansial/kebocoran KTP), Sedang (gangguan operasional terbatas), Rendah (masalah minor).

## 3. Tabel Daftar Risiko Prioritas & Rencana Kontrol

| No | ID Ancaman | Risiko Prioritas | Kemungkinan | Dampak | Alasan Berdasarkan Kondisi Produk | Rencana Kontrol & Pemetaan Tugas |
| :---: | :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | TM-01 / TM-02 | **Pembobolan Akun Admin / Pencurian Sesi** | Sedang | Tinggi | Pengelola rentan memakai sandi lemah. Pembobolan dasbor berakibat bocornya data penghuni, KTP, dan akses keuangan. | **Kontrol (Tugas 2):**<br>• Gunakan *slow hashing* (Bcrypt/Argon2) untuk kata sandi.<br>• Simpan token sesi (JWT) pada *cookie* `HttpOnly` & `Secure` guna mencegah pencurian via XSS. |
| **2** | TM-04 | **Manipulasi Nominal Pembayaran Sewa** | Tinggi | Tinggi | Pengguna dengan alat *proxy* (seperti Burp Suite) dapat mencegat dan mengecilkan nominal tagihan sebelum data masuk ke server. | **Kontrol (Tugas 2 & 3):**<br>• Terapkan validasi sisi server. Nominal tagihan wajib dicocokkan dengan harga asli di basis data berdasarkan ID kamar, bukan dari input pengguna. |
| **3** | TM-07 | **Kebocoran Arsip Foto KTP Penyewa** | Sedang | Tinggi | File KTP yang tersimpan di direktori publik rentan diakses oleh sembarang orang jika URL-nya ditebak, melanggar UU PDP. | **Kontrol (Tugas 2):**<br>• Simpan file KTP di luar area direktori publik (*root*).<br>• Gunakan *middleware* untuk memastikan hanya *Super Admin* yang bisa mengakses file tersebut. |
| **4** | TM-10 | **Staf Lapangan Mengakses Laporan Keuangan** | Sedang | Sedang | Penjaga kos dapat mengintip laporan laba rugi pemilik dengan cara menebak URL ekspor apabila sistem tidak membatasi hak akses. | **Kontrol (Tugas 2):**<br>• Terapkan *Role-Based Access Control* (RBAC). Blokir akses ke URL keuangan bagi pengguna yang hanya berstatus staf lapangan (403 Forbidden). |
| **5** | TM-05 | **Perubahan Data Tanpa Jejak (Audit Trail)** | Tinggi | Sedang | Staf dapat menghapus data penghuni atau memberi diskon sepihak tanpa jejak, sehingga merusak akurasi laporan audit bulanan. | **Kontrol (Tugas 2):**<br>• Buat modul *Audit Trail*. Rekam waktu, identitas pelaku, dan aksi (edit, hapus, diskon) secara otomatis ke dalam tabel log khusus. |

## 4. Kesimpulan Rencana Mitigasi
Lima rencana kontrol ini akan diimplementasikan pada **Tugas 2 (Hardening, Otorisasi, dan RBAC)** untuk menurunkan tingkat kerentanan pada operasional R-Stay.
