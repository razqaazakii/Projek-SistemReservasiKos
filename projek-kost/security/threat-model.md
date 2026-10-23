## 1. Pendahuluan
Dokumen *Threat Model* ini menguraikan analisis ancaman keamanan siber pada produk **R-Stay** menggunakan metodologi **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). Analisis ini diturunkan secara langsung dari Diagram Aliran Data (`dfd.md`) dan inventaris aset (`asset-inventory.md`) yang berjalan pada sistem manajemen kos.

## 2. Tabel Analisis Ancaman STRIDE (Minimal 10 Ancaman)

| No | ID Ancaman | Elemen DFD Terdampak | Kategori STRIDE | Aset Terdampak | Deskripsi Spesifik Ancaman pada Produk R-Stay |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | TM-01 | PR-01 (Autentikasi Pengguna) | **S**poofing | AST-01 (Kredensial Password) | Penyerang melakukan serangan *brute-force* atau *credential stuffing* pada halaman login (`/login`) untuk menebak kata sandi akun Admin / Pengelola kos. |
| **2** | TM-02 | PR-01 (Autentikasi Pengguna) | **S**poofing | AST-02 (Token Sesi JWT) | Penyerang mengeksploitasi celah *Cross-Site Scripting (XSS)* untuk mencuri token sesi (JWT) milik admin yang tersimpan di browser, lalu menyamar sebagai admin tanpa melalui proses login. |
| **3** | TM-03 | DS-01 (Database Kredensial) | **T**ampering | AST-01 (Kredensial Password) | Pihak internal atau penyerang yang berhasil menyusup ke server database mengubah nilai *hash* sandi di tabel pengguna secara langsung untuk mengambil alih hak akses penuh. |
| **4** | TM-04 | PR-03 (Modul Keuangan & Pembayaran) | **T**ampering | AST-05 (Data Transaksi & Tagihan) | Pengguna (penyewa) mencegat lalu lintas jaringan (*intercept* menggunakan Burp Suite) saat mengeklik tombol "Bayar" dan memanipulasi parameter harga sewa (misal mengubah dari Rp 1.850.000 menjadi Rp 10.000). |
| **5** | TM-05 | DS-02 (Database Penghuni & KTP) | **R**epudiation | AST-03 (Dokumen KTP) & AST-05 (Data Transaksi) | Admin atau penjaga kos menghapus arsip data penyewa atau mengubah status tagihan menjadi lunas secara sepihak tanpa sistem mencatat riwayat pelakunya (ketiadaan *audit trail*). |
| **6** | TM-06 | PR-03 & Eksternal (WA Gateway) | **R**epudiation | AST-04 (Kontak) & AST-05 (Tagihan) | Penyewa dapat menyangkal bahwa mereka telah menerima pesan pengingat tagihan kos karena tidak adanya pencatatan log status pengiriman pesan yang valid dari API WhatsApp Gateway. |
| **7** | TM-07 | DS-02 (Penyimpanan Arsip KTP) | **I**nformation Disclosure | AST-03 (Dokumen KTP) | Berkas foto KTP penyewa yang diunggah disimpan di direktori publik server web yang dapat diakses atau ditebak tautan URL-nya secara langsung oleh publik tanpa proses otorisasi. |
| **8** | TM-08 | TB-01 (Jaringan Publik / Internet) | **I**nformation Disclosure | AST-01 & AST-02 | Pengelola atau penyewa mengakses dasbor R-Stay menggunakan jaringan Wi-Fi publik yang tidak terenkripsi, sehingga kredensial login rentan disadap melalui serangan *packet sniffing*. |
| **9** | TM-09 | PR-02 (Manajemen Kamar & Data) | **D**enial of Service | AST-08 (Backend API & Server) | Penyerang mengirimkan ribuan permintaan HTTP masif (*Layer 7 Flood*) secara serentak ke endpoint API pencarian atau filter kamar kosong hingga server kos mengalami kehabisan memori (*out of memory*). |
| **10** | TM-10 | PR-03 (Modul Keuangan & Laporan) | **Elevation of Privilege** | AST-05 (Data Keuangan) | Staf lapangan (penjaga kos) dengan hak akses rendah mencoba mengakses rute URL ekspor laporan keuangan tahunan pemilik dengan menebak endpoint secara langsung (*IDOR* / *Broken Access Control*). |

---

## 3. Kesimpulan Pemodelan Ancaman
Kesepuluh ancaman di atas merepresentasikan titik-titik kerentanan utama yang melekat pada alur data R-Stay. Temuan ini menjadi acuan dasar dalam menentukan lima risiko prioritas tertinggi yang dirumuskan di dalam dokumen `risk-register.md`.