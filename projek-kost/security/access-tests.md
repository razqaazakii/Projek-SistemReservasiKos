# Laporan Uji Kontrol Akses & Keamanan Kata Sandi
**Aplikasi:** R-Stay (Sistem Manajemen & Reservasi Kos)  
**Penanda Rilis:** `sec-0.2`

---

## 1. Bukti Penggunaan Fungsi Hash Lambat (Bcrypt)

Untuk melindungi kata sandi pengguna dari kebocoran database, sistem menggunakan fungsi hash lambat **Bcrypt (Cost Factor = 10)** pada berkas `actions/auth.ts`.

Berikut bukti penyimpanan kata sandi pada akun uji coba tanpa membuka data nyata:

* **Akun Uji:** `admin_uji@rstay.internal`
* **Peran Akun:** `ADMIN`
* **Hasil Hash di Database:**
  ```text
  $2b$10$14CzoI9wMq9.Dffmb2/pDua0VhroMurHjsbRL8jMcWGtkJCBDeXta
  ```

**Penjelasan Sederhana Format Hash:**
* `$2b$` : Bukti menggunakan algoritma **Bcrypt** (bukan fungsi hash cepat seperti MD5/SHA-256).
* `$10$` : Tingkat kesulitan komputasi (1.024 putaran) agar peretas tidak bisa menebak password dengan cepat.
* Karakter berikutnya adalah kombinasi pelindung (*salt* acak) dan hasil enkripsi yang aman dari serangan *rainbow table*.
* **Rujukan Risiko Tugas 1:** `TM-01` (Mencegah pembobolan akun lewat tebakan password massal/brute force).

---

## 2. Matriks Hak Akses Per Peran (RBAC)

Tabel ini menentukan wewenang akses per peran di aplikasi R-Stay:

| Fitur / Halaman | Tamu (Belum Login) | Penyewa Kos | Penjaga (Staf) | Pemilik (Admin) | Rujukan Risiko |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lihat Katalog Kamar** | ✅ Boleh | ✅ Boleh | ✅ Boleh | ✅ Boleh | - |
| **Pemesanan Kamar** | ❌ (Wajib Login) | ✅ Boleh | ❌ Ditolak | ✅ Boleh | `TM-01` |
| **Lihat KTP Milik Sendiri** | ❌ Ditolak | ✅ Boleh | ❌ Ditolak | ✅ Boleh | `TM-07` |
| **Lihat KTP Penyewa Lain** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Boleh | `TM-07` |
| **Tambah / Edit Kamar** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Boleh | - |
| **Laporan Keuangan Kos** | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak | ✅ Boleh | `TM-10` |

---

## 3. Hasil Pengujian Kontrol Akses (Positif vs Negatif)

Sesuai ketentuan rubrik, pengujian akses sah (**positif**) dan pengujian akses tidak sah (**negatif**) dilakukan dalam jumlah yang seimbang (1 : 1).

### 3.1. Uji Akses Positif (Aksi Sah yang Diizinkan Sesuai Hak Peran)

| No | Skenario Uji Positif | Akun Penguji | Aksi Sah yang Dijalankan | Hasil Sistem | Status |
| :-: | :--- | :--- | :--- | :---: | :---: |
| **P-1** | Tamu melihat katalog kos | Publik (*Guest*) | Mengakses halaman `/rooms` | **200 OK** (Daftar kamar ditampilkan) | ✅ Lulus |
| **P-2** | Penyewa terdaftar memesan kamar | `penyewa_uji` (User) | Mengirim formulir reservasi kamar aktif | **200 OK** (Booking tersimpan) | ✅ Lulus |
| **P-3** | Penyewa melihat KTP miliknya sendiri | `penyewa_uji` (User) | Membuka dokumen identitas di profilnya | **200 OK** (Akses diizinkan) | ✅ Lulus |
| **P-4** | Pemilik kos mengelola data kamar & omzet | `admin_uji` (Admin) | Mengakses dashboard statistik & kamar | **200 OK** (Laporan keuangan terbuka) | ✅ Lulus |

### 3.2. Uji Akses Negatif (Aksi Tidak Sah yang Ditolak oleh Sistem)

| No | Skenario Uji Negatif | Akun Penguji | Aksi Terlarang yang Dicoba | Hasil Sistem | Status Pengujian | Rujukan Risiko |
| :-: | :--- | :--- | :--- | :---: | :---: | :---: |
| **N-1** | Tamu memesan kamar tanpa login | Tanpa Akun (*Guest*) | Mengirim formulir booking kamar | **401 Unauthorized** (Wajib login) | ✅ Berhasil Ditolak | `TM-01` |
| **N-2** | Penyewa mengintip KTP penyewa lain | `penyewa_uji` (User) | Membuka link foto KTP milik user lain | **403 Forbidden** (Akses dilarang) | ✅ Berhasil Ditolak | `TM-07` |
| **N-3** | Staf non-admin melihat omzet kos | `staf_lapangan` (Staff) | Membuka rute laporan keuangan pemilik | **403 Forbidden** (Akses dilarang) | ✅ Berhasil Ditolak | `TM-10` |
| **N-4** | Manipulasi tarif kamar via request | `penyewa_uji` (User) | Mengubah tarif kamar menjadi Rp 10.000 | **400 Bad Request** (Data tidak sah) | ✅ Berhasil Ditolak | `TM-04` |

---

## 4. Kesimpulan
1. **Rasio Uji Seimbang:** Jumlah pengujian akses positif (4 kasus) sama banyaknya dengan pengujian akses negatif (4 kasus).
2. **Kata Sandi Aman:** Menggunakan fungsi hash lambat Bcrypt Cost 10 sehingga akun terlindungi dari serangan kebocoran kredensial massal (`TM-01`).
3. **Hak Akses Ketat:** Seluruh upaya akses ilegal terbukti berhasil diblokir oleh sistem dengan status HTTP 401 dan 403.
