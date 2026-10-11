# Sistem Reservasi Kos - Dokumentasi Proyek

**Mata Kuliah:** Kriptografi

## 1. Informasi Pengembang

| Field | Keterangan |
|---|---|
| Nama | Razqa Azaki |
| NIM | 105224046 |

## 2. Kebutuhan Kriptografi

### Tabel Kebutuhan Keamanan

Tabel ini memetakan data penting di dalam aplikasi beserta perlindungan spesifik yang harus diterapkan untuk menjaga keamanannya.

| No | Data / Aset yang Dilindungi | Tujuan Keamanan | Komponen Kriptografi | Prioritas |
|---|---|---|---|---|
| 1 | Password pengguna | Kerahasiaan: Password asli tidak boleh disimpan di pangkalan data (database). | Scrypt KDF + Salt Acak | Tinggi |
| 2 | Integritas data reservasi | Integritas: Mencegah data transaksi diubah secara diam-diam oleh pihak ketiga. | HMAC-SHA256 | Tinggi |
| 3 | Token sesi autentikasi | Autentikasi: Token harus sangat acak agar tidak bisa ditebak oleh peretas. | CSPRNG randomBytes(48) | Tinggi |
| 4 | Objek data reservasi (JSON) | Integritas: Mendeteksi perubahan sekecil apa pun pada struktur data. | SHA-256 (Kanonikalisasi JSON) | Menengah |
| 5 | Salt (Garam) pembangkit hash | Keacakan: Setiap pengguna harus memiliki pelindung hash yang unik dan tidak terprediksi. | CSPRNG randomBytes(32) | Menengah |

---

## 3. Rancangan Komponen

### Komponen 1: Pengelolaan Password

Berfungsi untuk mengamankan password pengguna agar tidak bisa dibaca oleh siapa pun, termasuk oleh pengembang aplikasi.

- **Masukan (Input):** Teks password asli dan salt (opsional).
- **Proses:** Sistem membuat nilai acak (salt), menggabungkannya dengan password asli, lalu mengacaknya menggunakan algoritma Scrypt.
- **Keluaran (Output):** Kombinasi nilai hash dan salt sepanjang 64 karakter.
- **Representasi Data:** Disimpan dalam format teks hexadecimal agar aman dan mudah dimasukkan ke dalam pangkalan data.
- **Sumber Keacakan:** Menggunakan `crypto.randomBytes` dari Node.js yang mengambil nilai acak langsung dari mesin sistem operasi (CSPRNG).

---

### Komponen 2: Pembangkit Token Sesi

Berfungsi membuat tanda pengenal unik saat pengguna berhasil login.

- **Masukan (Input):** Panjang target karakter (bawaan: 96 karakter).
- **Proses:** Sistem menghasilkan sekumpulan byte acak lalu menerjemahkannya ke format teks.
- **Keluaran (Output):** Teks hexadecimal dengan tingkat acak yang sangat tinggi (384-bit entropy).
- **Representasi Data:** Disimpan di dalam cookie peramban (browser) atau header otorisasi.
- **Sumber Keacakan:** Menggunakan `crypto.randomBytes(48)`. Setiap kali dipanggil, fungsi ini dijamin menghasilkan kode yang berbeda.

---

### Komponen 3: Integritas Data Reservasi (HMAC)

Berfungsi sebagai "stempel keamanan" untuk memastikan nominal harga atau data kamar tidak diedit secara ilegal.

- **Masukan (Input):** Teks data reservasi dan Kunci Rahasia (Secret Key).
- **Proses:** Mengunci data menggunakan algoritma HMAC-SHA256 yang divalidasi oleh Kunci Rahasia.
- **Keluaran (Output):** Teks hexadecimal sepanjang 64 karakter (disebut nilai MAC).
- **Representasi Data:** Disimpan berdampingan dengan data reservasi sebagai bukti keaslian transaksi.
- **Sumber Keacakan:** Komponen ini tidak membutuhkan nilai acak, melainkan murni bergantung pada seberapa rahasia Secret Key yang disimpan di server.

---

### Komponen 4: Pembuatan Sidik Jari Objek Reservasi

Berfungsi untuk memastikan struktur dan isi objek data (JSON) selalu konsisten.

- **Masukan (Input):** Objek data reservasi (JSON).
- **Proses:** Sistem mengurutkan nama-nama data sesuai abjad agar seragam (kanonikalisasi), merombaknya menjadi teks, lalu memprosesnya dengan SHA-256.
- **Keluaran (Output):** Teks hexadecimal sepanjang 64 karakter.
- **Representasi Data:** Bersifat pasti (deterministik). Selama isi datanya sama, urutan penyusunan tidak akan merubah hasil akhir.
- **Sumber Keacakan:** Tidak menggunakan nilai acak.

---

### Alur Kerja Registrasi & Login

**Proses Registrasi (Daftar Akun Baru):**
1. Sistem menerima password asli dari pengguna.
2. Sistem memanggil `generateSalt()` untuk membuat kode acak pelindung (salt).
3. Sistem menggabungkan password dan salt ke dalam fungsi `hashPassword()`.
4. Sistem membuang password asli dan hanya menyimpan hasil hash beserta salt tersebut ke database.

**Proses Autentikasi (Login):**
1. Sistem menerima ketikan password dari pengguna.
2. Sistem mengambil nilai hash dan salt milik pengguna tersebut dari database.
3. Sistem memverifikasi kecocokkannya melalui fungsi `verifyPassword()`.
4. Jika cocok (bernilai `true`), sistem memanggil `generateSessionToken()` untuk membuat tiket sesi dan membiarkan pengguna masuk.


## 4. Skenario Pengujian (Testing Scenarios)

Pengujian sistem berada di dalam berkas `__tests__/crypto_core.test.js` dan dieksekusi secara otomatis menggunakan perangkat lunak **Jest**.

### Kategori Pengujian

Sistem diuji dengan empat cara untuk memastikan ketahanannya:

| Kategori | Deskripsi |
|---|---|
| **Skenario Positif (Happy Path)** | Menguji kondisi ideal di mana sistem harus bekerja dengan benar saat menerima masukan data yang valid (contoh: login dengan password yang benar berhasil masuk). |
| **Skenario Negatif (Error Handling)** | Menguji pertahanan sistem saat diserang dengan data yang salah, kosong, atau berbahaya (contoh: login dengan password yang salah atau dimanipulasi harus ditolak). |
| **Skenario Batas (Edge Case)** | Menguji perilaku sistem saat menghadapi situasi ekstrem di ujung batas toleransi (contoh: menguji password sepanjang 1 karakter hingga 1.000 karakter, atau memakai karakter simbol/emoji). |
| **Skenario Vektor (Test Vector)** | Menguji konsistensi hitungan algoritma. Sistem harus mampu menghasilkan nilai perhitungan matematis yang selalu cocok dan konsisten secara universal. |

### Cara Menjalankan Pengujian

```bash
# Menjalankan seluruh pengujian otomatis
npx jest crypto_core.test.js
```


## 5. Hasil Pengujian (K4)

Dijalankan dengan perintah: `npx jest crypto_core.test.js`

### Ringkasan Hasil

| Test Suite | Total | Passed | Failed | Waktu |
|---|---|---|---|---|
| crypto_core.test.js | 26 | 26 ✅ | 0 | ~0.4 s |

### Detail Per Skenario

| No | Skenario / Kelompok | Jumlah Test | Hasil | Jenis |
|---|---|---|---|---|
| 1 | Skenario Positif (Happy Path) | 6 | ✅ 6 Passed | Positif |
| 2 | Skenario Negatif (Error Handling) | 9 | ✅ 9 Passed | Negatif |
| 3 | Skenario Batas (Edge Case) | 7 | ✅ 7 Passed | Batas |
| 4 | Skenario Vektor (Test Vector) | 4 | ✅ 4 Passed | Deterministik |
| **Total** | | **26** | **26 Passed / 0 Failed** | |

---

### Daftar Lengkap Test Case

#### Skenario 1: Positif

| Test | Hasil |
|---|---|
| hashPassword menghasilkan objek `{ hash, salt }` yang valid | Pass |
| verifyPassword mengembalikan `true` untuk password yang benar | Pass |
| generateSessionToken menghasilkan token hex 96 karakter | Pass |
| validateTokenFormat mengembalikan `true` untuk token valid | Pass |
| Dua token dari generateSessionToken selalu berbeda (acak) | Pass |
| generateSalt menghasilkan salt hex 64 karakter | Pass |

#### Skenario 2: Negatif

| Test | Hasil |
|---|---|
| hashPassword melempar Error untuk string kosong | Pass |
| hashPassword melempar Error untuk input bukan string (angka) | Pass |
| hashPassword melempar Error untuk input null | Pass |
| verifyPassword mengembalikan `false` untuk password salah | Pass |
| verifyPassword mengembalikan `false` jika salt dipalsukan | Pass |
| verifyPassword mengembalikan `false` untuk password kosong | Pass |
| validateTokenFormat -> `false` untuk token terlalu pendek | Pass |
| validateTokenFormat -> `false` untuk string bukan hex | Pass |
| validateTokenFormat -> `false` untuk tipe non-string | Pass |

#### Skenario 3: Batas

| Test | Hasil |
|---|---|
| hashPassword berhasil untuk password 1 karakter | Pass |
| hashPassword berhasil untuk password 1000 karakter | Pass |
| hashPassword berhasil untuk password Unicode/emoji | Pass |
| Hash deterministik: salt sama → hash selalu sama | Pass |
| Hash berbeda: salt berbeda → hash berbeda (anti rainbow table) | Pass |
| validateTokenFormat -> `false` untuk token 97 karakter (terlalu panjang) | Pass |
| validateTokenFormat -> `false` untuk token 95 karakter (kurang 1) | Pass |

#### Skenario 4: Vektor (Deterministik)

| Test | Hasil |
|---|---|
| hashPassword menghasilkan hash identik untuk input yang sama | Pass |
| verifyPassword berhasil validasi dengan nilai vektor yang diketahui | Pass |
| verifyPassword gagal untuk password berbeda pada vektor sama | Pass |
| Format hash: hex 64 karakter (SHA-256 = 32 bytes) | Pass |

---

## 6. Catatan Keputusan Desain

### Keputusan Desain dan Evaluasi

- **Status Sandi Klasik:** Sandi klasik (seperti Caesar atau Vigenere) hanya ditandai sebagai bahan pembelajaran dasar dan tidak digunakan sebagai perlindungan produk karena sangat rentan diretas.

- **Pemilihan Pustaka:** Menggunakan modul bawaan Node.js (`crypto`) karena stabil, tidak memberatkan proyek (zero-dependency), dan menggunakan sistem keamanan bawaan OS yang berstandar internasional.

- **Encoding vs Enkripsi/Hashing:** Sistem membedakan kedua fungsi ini dengan tegas:
  - *Encoding* (contoh: format hex) hanya untuk mengubah wujud data agar mudah disimpan, bukan untuk mengamankan isi data.
  - *Enkripsi/Hashing* (algoritma Scrypt, HMAC, SHA-256) digunakan khusus untuk melindungi dan menyembunyikan kerahasiaan data.

- **Pencegahan Timing Attack:** Validasi login dan MAC diproses menggunakan `crypto.timingSafeEqual()` agar peretas tidak bisa menebak password berdasarkan durasi respons dari server.