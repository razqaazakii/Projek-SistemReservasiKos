# AI_LOG.md - Catatan Penggunaan AI

Dokumen ini mencatat pemanfaatan AI selama pengembangan **Sistem Reservasi Kos**. 

## Log Sesi

### 2026-10-11 (Sesi 1) - Antigravity (Google DeepMind)
- **Tool**: Antigravity (Google DeepMind)
- **Tujuan**: Mengimplementasikan pengamanan kata sandi berbasis KDF (Key Derivation Function) dan memvalidasi kecocokan verifikasi kata sandi saat login.
- **Ringkasan prompt**: *"Bantu buatkan fungsi pengelolaan kata sandi yang aman dengan Scrypt dan fungsi verifikasi login yang tahan brute-force."*
- **Bagian yang digunakan**: Implementasi logika fungsi `hashPassword` dan `verifyPassword` menggunakan `crypto.scryptSync`.
- **Bagian yang diubah**:
  1. Menerapkan algoritma `scryptSync` yang digabungkan dengan *salt* acak untuk melindungi kata sandi dari serangan *rainbow table*.
  2. Mengonfigurasi parameter *work factor* standar OWASP (`N: 16384, r: 8, p: 1`) agar proses *hashing* membutuhkan memori RAM yang cukup untuk menghalau serangan *brute-force* berbasis GPU.
  3. Menyusun fungsi `verifyPassword` agar menghitung ulang hash dari *salt* tersimpan dan memvalidasinya secara aman.

---

### 2026-10-11 (Sesi 2) - Google Gemini
- **Tool**: Google Gemini
- **Tujuan**: Memahami sintaks ekspresi reguler (RegExp) dan parameter algoritma Scrypt.
- **Ringkasan prompt**: *"Sebutkan sumber referensi Regex token Hex (`/^[0-9a-f]+$/i`) dan jelaskan fungsi parameter `{ N: 16384, r: 8, p: 1 }` pada KDF Scrypt."*
- **Bagian yang digunakan**: Penjelasan pola Regex dan konsep *memory-hard function* Scrypt sebagai persiapan demonstrasi.
- **Bagian yang diubah**: (Hanya pemantapan teori, tidak ada modifikasi kode langsung).
- **Verifikasi**: Membaca referensi JavaScript RegExp (MDN) untuk memastikan arti simbol pencarian (`^`, `$`, `[0-9a-f]`, `+`, `i`). Mengecek dokumentasi resmi Node.js Crypto API untuk memvalidasi fungsi alokasi RAM (parameter `N`) dalam mencegah serangan *brute-force* berbasis GPU.

---

### 2026-10-12 (Sesi 3) - Gemini (Google) (tag v0.1)
- **Tool**: Google Gemini
- **Tujuan**: Mengatasi kendala pengujian akibat perbedaan ukuran *byte* vs Hex, serta merapikan struktur laporan agar memenuhi standar rubrik K1 dan K2.
- **Ringkasan prompt**: *"ini error nya coba anda baca kembali agar bisa success", "Berikan penjelasan keputusan desain yang singkat saja dan jelas"*
- **Bagian yang digunakan**: Solusi penyesuaian ukuran `randomBytes` pada *salt* dan draf penyusunan keputusan desain kriptografi.
- **Bagian yang diubah**: 
  1. Menaikkan alokasi pembangkitan *salt* dari 16 menjadi 32 *byte* agar menghasilkan 64 karakter Hex (sesuai ekspektasi skenario uji).
  2. Menambahkan `crypto.timingSafeEqual()` pada `verifyPassword` dan `verifyBookingMac` untuk mencegah celah eksploitasi waktu (*Timing Attack*).
  3. Menyempurnakan isi `README.md` dengan menyertakan *disclaimer* sandi klasik, beda konsep *Encoding* dan *Enkripsi*, serta alasan penggunaan modul bawaan Node.js.
- **Verifikasi**: Mencocokkan kelengkapan isi laporan dengan *Grading Criteria Rubrik Kriptografi 052357*. Menguji ulang seluruh skenario lewat terminal untuk memastikan statusnya tetap lulus. Memeriksa ulang basis kode agar tidak ada kata sandi atau *secret key* yang tertulis secara terang-terangan (*hardcoded*).