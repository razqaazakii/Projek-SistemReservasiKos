# KEPUTUSAN.md — Keputusan Arsitektur Kriptografi (Tugas 2)

**Mata Kuliah:** Kriptografi & Keamanan Siber  
**Topik:** Tugas 2 — Enkripsi Terautentikasi dan Integritas Data (Kriptografi)  
**Aplikasi:** R-Stay (Sistem Informasi Reservasi Kos)  
**Pengembang:** Razqa Azaki (NIM: 105224046)  
**Versi Rilis:** `v0.2`  
**Repository:** [GitHub - Projek-SistemReservasiKos](https://github.com/razqaazakii/Projek-SistemReservasiKos.git)  

---

## 1. Alur Keputusan: Kebutuhan → Mekanisme → Alasan

```
+--------------------------------------------------------------------------------+
|                                1. KEBUTUHAN                                    |
|  - Kerahasiaan data produk kamar kos (catatan sewa internal, marjin harga)     |
|  - Integritas data terhadap manipulasi bit / tampering oleh penyerang          |
|  - Otentikasi asal dan pengikatan konteks (mencegah context-swap antar kamar)  |
+--------------------------------------------------------------------------------+
                                       │
                                       ▼
+--------------------------------------------------------------------------------+
|                                2. MEKANISME                                    |
|  - Authenticated Encryption with Associated Data (AEAD)                        |
|  - Algoritma: AES-256-GCM (Galois/Counter Mode) via pustaka 'node:crypto'      |
|  - Kunci 256-bit CSPRNG disimpan di luar repositori (.env)                     |
|  - Nonce 96-bit unik per enkripsi, Tag 128-bit, AAD context binding           |
+--------------------------------------------------------------------------------+
                                       │
                                       ▼
+--------------------------------------------------------------------------------+
|                                  3. ALASAN                                     |
|  - Single-Pass efisien (kerahasiaan + integritas dalam 1 putaran komputasi)   |
|  - Tahan serangan Padding Oracle & Bit-Flipping                                |
|  - Akselerasi hardware CPU (AES-NI) standar industri TLS 1.3 / NIST SP 800-38D|
|  - Pustaka terstandar & aktif terpelihara (zero external dependency risk)      |
+--------------------------------------------------------------------------------+
```

---

### 1.1 Kebutuhan Keamanan (Threat Model & Business Requirements)

Pada platform **R-Stay**, data produk kamar kos memuat informasi publik (katalog kamar, fasilitas standar) sekaligus informasi internal yang sensitif dan kritikal:
1. **Catatan Sewa & Kebijakan Harga Internal Pemilik Kos:** Catatan diskon khusus, batas marjin sewa, perjanjian khusus pemilik kamar dengan penyewa jangka panjang.
2. **Keterkaitan Data Produk dengan Penghuni:** Identitas penyewa yang terikat langsung pada kamar tertentu.

**Potensi Ancaman (Threats):**
* **Pelanggaran Kerahasiaan (*Eavesdropping / Data Breach*):** Pihak yang menyusup ke database atau mengintip lalu lintas transit dapat membaca catatan rahasia bisnis dan data harga internal.
* **Manipulasi Data (*Tampering / Bit-Flipping Attack*):** Pada skema enkripsi standar tanpa otentikasi (seperti stream cipher atau CBC murni tanpa MAC), penyerang dapat membalik bit (*bit-flipping*) pada ciphertext untuk memodifikasi nilai angka atau syarat sewa tanpa merusak proses dekripsi.
* **Serangan Pemindahan Konteks (*Cut-and-Paste / Context-Swap Attack*):** Penyerang dapat menyalin ciphertext yang sah dari Kamar A (misal kamar reguler bertarif murah) dan menempelkannya ke Kamar B (kamar VIP eksekutif) jika data terenkripsi tidak diikat secara kriptografis ke identitas kamar/produk terkait.
* **Serangan Oracle (*Padding Oracle Attack*):** Enkripsi mode blok seperti CBC rentan terhadap serangan analisis padding error yang dapat membocorkan seluruh plaintext secara bertahap.

Oleh karena itu, sistem membutuhkan mekanisme yang **secara atomik melindungi kerahasiaan sekaligus integritas dan keaslian konteks data**.

---

### 1.2 Mekanisme yang Dipilih: AEAD AES-256-GCM

Mekanisme yang dipilih adalah **Authenticated Encryption with Associated Data (AEAD)** berbasis algoritma **AES-256-GCM (Advanced Encryption Standard in Galois/Counter Mode)** yang diimplementasikan menggunakan pustaka bawaan terstandar **Node.js `crypto`** (OpenSSL engine).

#### Parameter Kriptografi Terdokumentasi Lengkap

| Parameter | Spesifikasi / Ukuran | Mekanisme Pembangkitan / Format | Peran Keamanan |
| :--- | :--- | :--- | :--- |
| **Panjang Kunci (*Key Length*)** | **256 bit** (32 bytes) | 64 karakter hexadecimal, dibangkitkan dengan CSPRNG (`crypto.randomBytes(32)`) | Memberikan tingkat proteksi keamanan brute-force tertinggi ($2^{256}$ kemungkinan) dan tahan ancaman komputasi kuantum. |
| **Nonce / IV Unik** | **96 bit** (12 bytes) | 24 karakter hexadecimal, dibangkitkan baru setiap kali enkripsi dengan CSPRNG (`crypto.randomBytes(12)`) | Menjamin bahwa plaintext yang sama menghasilkan ciphertext yang selalu berbeda. Nonce tidak pernah diulang (*never reused*). |
| **Additional Authenticated Data (AAD)** | Variabel (misal: `kamar:kost-001`) | String UTF-8 / Buffer representasi konteks entitas | Mengikat ciphertext ke konteks produk/kamar secara kriptografis. AAD tidak dienkripsi tetapi diverifikasi utuh oleh tag otentikasi. |
| **Tag Otentikasi (*Authentication Tag*)** | **128 bit** (16 bytes) | 32 karakter hexadecimal, dihasilkan oleh modul GMAC via `cipher.getAuthTag()` | Melindungi ciphertext dan AAD dari pemalsuan. Jika ada perubahan 1 bit pada data/AAD, verifikasi tag akan gagal seketika. |
| **Format Serial Portabel** | Format komposit `v1:<iv>:<tag>:<ciphertext>` | String ASCII terkontrol | Memudahkan penyimpanan pada satu kolom database atau transmisi API secara terstruktur. |

---

### 1.3 Alasan Pemilihan & Analisis Trade-Off

Berikut adalah matriks komparasi teknis yang mendasari keputusan pemilihan **AES-256-GCM**:

| Kriteria Evaluasi | AES-256-GCM (Pilihan R-Stay) | AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC) | ChaCha20-Poly1305 | AES-ECB |
| :--- | :--- | :--- | :--- | :--- |
| **Kategori Mekanisme** | **AEAD (Single-Pass)** | Kombinasi Manual (Two-Pass) | **AEAD (Single-Pass)** | Enkripsi Blok Murni |
| **Jaminan Kerahasiaan** | Ya (Sangat Kuat) | Ya | Ya | Buruk (Bocor Pola) |
| **Jaminan Integritas** | Ya (Tag GMAC 128-bit) | Ya (HMAC 256-bit) | Ya (Poly1305 128-bit) | **Tidak Ada** |
| **Dukungan Native AAD** | **Ya (Built-in standard)** | Harus dirancang manual | **Ya** | Tidak Ada |
| **Efisiensi Komputasi** | **Tinggi (1 putaran cipher)** | Rendah (2 putaran: enkripsi + hash) | Tinggi | Tinggi |
| **Akselerasi Hardware** | **Didukung (AES-NI pada x86_64)** | Terbatas pada fase AES saja | Tidak (Software-optimized) | Didukung |
| **Risiko Implementasi** | **Sangat Rendah** (Standar OpenSSL) | Tinggi (rawan timing oracle jika salah urutan) | Sangat Rendah | Sangat Fatal |
| **Standar Acuan** | NIST SP 800-38D, TLS 1.3 | RFC 7366 | RFC 8439 | Ditinggalkan |

**Alasan Utama Memilih AES-256-GCM:**
1. **Single-Pass AEAD:** Tidak memerlukan dua kunci terpisah atau dua tahapan komputasi seperti *Encrypt-then-MAC*. Kecepatan pemrosesan data produk jauh lebih tinggi.
2. **Perlindungan Terhadap Serangan Context-Swap melalui AAD:** Fitur AAD memungkinkan sistem mengikat identitas kamar (`roomId`) ke dalam tag kriptografi tanpa menambah ukuran ciphertext.
3. **Pustaka Terstandar & Terpelihara Tanpa Dependensi Pihak Ketiga:** Menggunakan modul bawaan `node:crypto` yang dipelihara langsung oleh tim inti Node.js dan OpenSSL. Hal ini meminimalkan risiko kerentanan rantai pasok (*supply chain attacks*).
4. **Kebal Serangan Padding Oracle:** Beroperasi dalam mode counter (CTR) sehingga tidak membutuhkan padding byte PKCS#7.

---

## 2. Penanganan Masukan dan Manajemen Kunci

### 2.1 Pembangkitan Kunci dengan CSPRNG
Kunci simetris 256-bit dibangkitkan menggunakan generator bilangan acak semu kriptografis (*Cryptographically Secure Pseudo-Random Number Generator* / CSPRNG) melalui `crypto.randomBytes(32)` yang memanfaatkan entropy pool kernel sistem operasi (`/dev/urandom` pada Linux/Unix atau `BCryptGenRandom` pada Windows).

Tersedia skrip otomatis untuk menghasilkan kunci baru:
```bash
npm run generate:key
```
Output:
```
7b7af1acc683fdd4baa0525df11c8c48e8a77ce084b1bd1d3b304d7357a412b7
```

### 2.2 Penyimpanan Kunci di Luar Repository (Prinsip Zero-Leakage)
* Kunci **TIDAK PERNAH** ditulis secara *hardcoded* di dalam kode sumber aplikasi.
* Kunci disimpan di lingkungan *runtime* lokal melalui berkas `.env`:
  ```env
  PRODUCT_ENCRYPTION_KEY="0ea59b3ed50308afb08083dc0a7b03c0e955176ddb242fcbb6d59057a001ea05"
  ```
* Berkas `.env` telah didaftarkan secara eksplisit dalam `.gitignore`:
  ```gitignore
  # env files — jangan pernah commit ke repository!
  .env
  .env*
  !.env.example
  ```
* Berkas `.env.example` yang dikomit ke GitHub **hanya memuat nilai sintetis / placeholder**:
  ```env
  PRODUCT_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  ```

### 2.3 Validasi Masukan & Prinsip Gagal Tertutup (*Fail-Closed*)
Sistem menerapkan validasi masukan ketat sebelum memproses data:
1. **Validasi Kunci:** Kunci wajib berukuran tepat 32 bytes (64 karakter hexadecimal). Jika panjang kunci kurang, berlebih, atau berformat salah, fungsi langsung melempar `TypeError`.
2. **Validasi Nonce/IV:** Wajib tepat 12 bytes (24 karakter hexadecimal).
3. **Validasi Tag:** Wajib tepat 16 bytes (32 karakter hexadecimal).
4. **Perilaku Gagal Tertutup (*Fail-Closed*):**
   * Apabila tag otentikasi tidak cocok, data ciphertext telah diubah, konteks AAD berbeda, atau kunci salah, fungsi `decryptProductAead` segera menangkap galat internal OpenSSL dan melempar galat generik tertutup:
     `Error: Autentikasi data gagal: data ciphertext, tag otentikasi, atau konteks AAD telah dimodifikasi, atau kunci salah.`
   * **Tidak ada potongan plaintext atau informasi struktur internal yang dikembalikan** saat autentikasi gagal.

---

## 3. Matriks Skenario Uji (Kriteria K4)

Pengujian diimplementasikan pada berkas `__tests__/crypto_core.test.js` menggunakan test runner **Jest**.

| No | Nama Skenario Uji | Kategori | Kondisi Input | Perilaku yang Diharapkan | Status |
| :-: | :--- | :---: | :--- | :--- | :---: |
| **1** | **Roundtrip Positif Data Produk** | Positif | Data produk kamar kos lengkap, kunci 256-bit CSPRNG, AAD `kamar:kost-001` | Enkripsi menghasilkan IV 24 hex, Tag 32 hex, dan ciphertext acak. Dekripsi sukses menghasilkan objek yang 100% identik dengan data asli. | **PASS** |
| **2** | **Modifikasi Ciphertext (Tampering)** | Negatif | 1 karakter hex pada ciphertext diubah (simulasi manipulasi harga kamar oleh penyerang) | Dekripsi gagal; sistem melempar galat tertutup dan menolak mengembalikan plaintext. | **PASS** |
| **3** | **Modifikasi Tag Otentikasi** | Negatif | 1 karakter hex pada authentication tag diubah | Dekripsi gagal; verifikasi GMAC menolak tag palsu dan melempar galat tertutup. | **PASS** |
| **4** | **Penggunaan Kunci yang Salah** | Negatif | Ciphertext sah didekripsi menggunakan kunci 256-bit acak lain | Dekripsi gagal; kunci salah ditolak seketika oleh verifikasi Galois Field. | **PASS** |
| **5** | **Modifikasi AAD (Context Swapping)** | Negatif | Ciphertext Kamar 001 didekripsi menggunakan AAD Kamar 999 | Dekripsi gagal; sistem menolak pertukaran konteks kamar meskipun ciphertext utuh. | **PASS** |
| **6** | **Keunikan Nonce (IV) CSPRNG** | Ketahanan | Plaintext yang sama dienkripsi dua kali dengan kunci yang sama | IV dan ciphertext yang dihasilkan pada panggilan 1 dan 2 berbeda (tidak deterministik). | **PASS** |
| **7** | **Validasi Masukan & Parameter** | Validasi | Kunci tidak sah (bukan 32 bytes), IV cacat, atau tag cacat | Sistem langsung melempar exception spesifik dan menghentikan operasi sebelum proses kriptografi. | **PASS** |
| **8** | **Serialisasi Portabel Ringkas** | Integrasi | String format `v1:<iv>:<tag>:<ciphertext>` | Serialisasi dan deserialisasi berhasil; format palsu ditolak. | **PASS** |

### Bukti Eksekusi Pengujian Otomatis (`npm test`)

```text
> projek-kost@0.1.0 test
> jest

PASS __tests__/crypto_core.test.js
  Kriptografi Kos-Kosan (Dasar)
    √ Token sesi memiliki format hex yang sesuai dan unik (3 ms)
    √ Verifikasi password yang benar harus berhasil (1 ms)
    √ Verifikasi password yang salah harus ditolak
    √ Verifikasi HMAC valid dari data reservasi (2 ms)
    √ Verifikasi HMAC gagal jika data dimodifikasi (Tampering)
    √ Urutan isi data (JSON) terbalik tetap menghasilkan hash yang sama
  Tugas 2 — Enkripsi Terautentikasi dan Integritas Data Produk (AEAD AES-256-GCM)
    √ Skenario 1 (Positif): Enkripsi & dekripsi data produk berhasil dan identik (Roundtrip) (3 ms)
    √ Skenario 2 (Negatif): Modifikasi ciphertext (Tampering) ditolak dan gagal tertutup (25 ms)
    √ Skenario 3 (Negatif): Modifikasi authentication tag ditolak dan gagal tertutup (2 ms)
    √ Skenario 4 (Negatif): Penggunaan kunci yang salah ditolak dan gagal tertutup (1 ms)
    √ Skenario 5 (Negatif): Modifikasi AAD (Context Swapping) ditolak (1 ms)
    √ Skenario 6: Enkripsi teks yang sama menghasilkan Nonce (IV) dan Ciphertext unik (1 ms)
    √ Skenario 7: Validasi masukan menolak kunci, IV, atau tag yang tidak valid (7 ms)
    √ Skenario 8: Serialisasi portabel string dapat didekripsi dengan sukses (1 ms)

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        0.66 s
Ran all test suites.
```

---

## 4. Panduan Demonstrasi Individual (±3 Menit Pekan 6)

Untuk evaluasi tatap muka pada pertemuan pekan 6, ikuti skenario runut berikut:

```
[00:00 - 01:00] Menjelaskan Kebutuhan, Mekanisme, dan 4 Parameter AEAD
                - Buka KEPUTUSAN.md dan lib/crypto_core.js
                - Tunjukkan fungsi encryptProductAead & decryptProductAead
                - Jelaskan parameter: Key 256-bit, Nonce 96-bit, AAD context, Tag 128-bit

[01:00 - 02:00] Menunjukkan Tempat Kunci Disimpan di Luar Repository & Fail-Closed
                - Buka file .env dan tunjukkan variabel PRODUCT_ENCRYPTION_KEY
                - Buka .gitignore dan buktikan baris '.env' aktif mengabaikan secret
                - Buka .env.example untuk menunjukkan hanya placeholder sintetis yang masuk git
                - Tunjukkan implementasi 'try { decipher.final() } catch' yang bersifat gagal tertutup

[02:00 - 03:00] Eksekusi Uji Otomatis & Penolakan Kondisi Tidak Sah
                - Jalankan perintah di terminal: npm test
                - Tunjukkan 8 skenario uji AEAD lulus:
                  1. Roundtrip berhasil
                  2. Modifikasi ciphertext ditolak
                  3. Modifikasi tag ditolak
                  4. Kunci salah ditolak
                  5. AAD swapping ditolak
```

