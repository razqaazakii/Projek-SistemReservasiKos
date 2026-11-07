# AI_LOG.md - Catatan Penggunaan AI

Dokumen ini mencatat riwayat pemanfaatan AI selama pengembangan sistem website **R-Stay (Sistem Reservasi Kos)**.

## 2026-10-13 · Antigravity
- Tujuan: Memperbaiki error TypeScript, integrasi formulir reservasi, serta mengatasi kerusakan sintaks JSX pada dashboard penyewa kos.
- Prompt ringkas: "Perbaiki error TypeScript dan sintaks JSX pada components/ReservationForm.tsx dan app/dashboard/penyewa/page.tsx"
- Bagian yang dipakai: Logika form reservasi, interface data Room & Tenant, serta penataan hierarki DOM JSX (`components/ReservationForm.tsx`, `app/dashboard/penyewa/page.tsx`, `types/dashboard.ts`, `lib/mockData.ts`).
- Yang diubah: 
  1. Menghubungkan re-export `@/lib/mockData` dari `@/data/roomsData` dan memberikan tipe eksplisit `(r: Room)` serta `(room: Room)` pada callback pencarian kamar kos.
  2. Menutup card wrapper tabel (`rounded-xl bg-white overflow-hidden`) yang sebelumnya tidak tertutup sehingga elemen modal terjebak di dalam tabel, serta menyeimbangkan tag pembuka dan penutup `<div>`.
  3. Melengkapi seluruh nilai default properti form agar sesuai dengan kontrak tipe data `Omit<Tenant, "id">` pada operasi tambah penyewa.
  4. Menghilangkan kelas CSS Tailwind yang bertabrakan (`bg-white` vs `bg-blue-50/40`) serta menstandarisasi kelas sembarang ke `rounded-xl`.
- Cara memeriksa: Menjalankan `npx tsc --noEmit` (lolos tanpa error), menjalankan build produksi Next.js `npm run build` (berhasil mengompilasi 18 rute statis/prerendered), dan menguji interaktivitas modal tambah/edit penyewa di peramban.


## 2026-11-01 · Antigravity (Tugas 2 / Milestone 2)
- Tujuan: Merancang arsitektur database relasional PostgreSQL dengan normalisasi Third Normal Form (3NF), integrasi Prisma ORM 7, implementasi Server Actions Next.js 16 (`'use server'`), validasi skema formulir Zod 4, dan manajemen sesi berbasis HTTP Cookie.
- Prompt ringkas: "Buatkan skema database 3NF dengan Prisma, Server Actions untuk booking dan katalog, validasi formulir dengan useActionState Modul 5, dan dokumentasi teknis Milestone 2."
- Bagian yang dipakai: `prisma/schema.prisma`, `prisma/seed.ts`, `actions/booking.ts`, `actions/room.ts`, `lib/session.ts`, `lib/validations/booking.ts`, `app/booking/page.tsx`, `docs/MILESTONE_2.md`.
- Yang diubah:
  1. Merancang 4 entitas relasional 3NF (`User`, `Room`, `Reservation`, `Penghuni`) yang menghilangkan anomali insersi dan redundansi data.
  2. Mengimplementasikan Server Actions (`createBookingAction`, `getRoomsAction`, `getRoomAction`) yang menangani validasi semantik, auto-linking akun, kalkulasi diskon, dan auto-registrasi penyewa.
  3. Memperbaiki komponen formulir pemesanan kamar `app/booking/page.tsx` menggunakan `useActionState`, `aria-invalid`, `aria-describedby`, dan pengembalian `{ galat, pesan, nilai }` agar isian formulir tidak hilang saat validasi gagal.
  4. Menyusun dokumentasi teknis komprehensif Milestone 2 (`docs/MILESTONE_2.md`).
- Cara memeriksa: Menjalankan `npx tsc --noEmit` (0 error), `npm run lint` (0 error), `npm test` (26/26 unit test lulus), dan `npm run build` (berhasil mengompilasi 21 rute halaman produksi).


## 2026-11-08 · Antigravity (Tugas 2 Kriptografi — Enkripsi Terautentikasi & Integritas Data)
- Tujuan: Mengimplementasikan mekanisme Enkripsi Terautentikasi (AEAD) berbasis AES-256-GCM untuk melindungi kerahasiaan dan integritas data produk kos, mengkaji teori dan alasan pemilihan algoritma, memecahkan masalah serangan pemalsuan bit (*bit-flipping*) dan penukaran konteks (*context-swap*), merancang penanganan kunci CSPRNG di luar repositori yang gagal tertutup (*fail-closed*), menyusun dokumen KEPUTUSAN.md murni teknis, serta memverifikasi ketiadaan kebocoran rahasia dengan data sintetis.
- Prompt ringkas:
  1. "Bagaimana menerapkan Enkripsi Terautentikasi (AEAD) AES-256-GCM pada data produk kos dengan 4 parameter (panjang kunci, nonce/IV unik, AAD, dan tag otentikasi) menggunakan modul bawaan node:crypto yang bersifat gagal tertutup?"
  2. "Mekanisme enkripsi ini sebenarnya dipilih berdasarkan teori apa? Mengapa bukan enkripsi biasa seperti AES-CBC, AES-ECB, atau ChaCha20, dan apa bedanya fungsi integritas MAC tag dengan enkripsi kerahasiaan murni?"
  3. "Kunci PRODUCT_ENCRYPTION_KEY didapat dari mana dan bagaimana cara kerjanya? Mengapa wajib dibangkitkan dengan CSPRNG dan disimpan di luar repositori (.env)?"
  4. "Periksa apakah ada kunci privat, token, password, atau data pribadi yang bocor di repositori, serta bersihkan dokumen KEPUTUSAN.md agar murni alur Kebutuhan -> Mekanisme -> Alasan tanpa memasukkan tabel rubrik penilaian dosen."
- Bagian yang dipakai: `lib/crypto_core.js`, `lib/crypto_core.d.ts`, `actions/room.ts`, `__tests__/crypto_core.test.js`, `KEPUTUSAN.md`, `README.md`, `.env.example`, `.env`, `.gitignore`, `package.json`.
- Yang diubah (Masalah yang Dipecahkan & Teori yang Diterapkan):
  1. **Mengatasi Kerentanan Manipulasi Data (*Bit-Flipping Attack*) melalui Teori Single-Pass AEAD:**  
     Menjawab masalah di mana enkripsi konvensional (seperti CBC atau CTR tanpa MAC) hanya menjaga kerahasiaan tetapi tidak kebal dari perubahan isi data oleh penyerang. Diimplementasikan fungsi `encryptProductAead` dan `decryptProductAead` berbasis AES-256-GCM yang secara simultan mengunci kerahasiaan dan menghitung *Authentication Tag* 128-bit GMAC dalam 1 putaran efisien (*single-pass*), memanfaatkan akselerasi hardware AES-NI pada CPU.
  2. **Mencegah Serangan Pemindahan Konteks (*Context-Swap / Cut-and-Paste Attack*) menggunakan AAD:**  
     Memecahkan masalah keamanan bisnis reservasi di mana penyerang berpotensi menyalin ciphertext sah dari kamar kos bertarif murah ke kamar bertarif mahal. Solusinya, identitas kamar (`kamar:roomId`) diikat sebagai *Additional Authenticated Data* (AAD) yang ikut divalidasi oleh Galois MAC sehingga proses dekripsi akan langsung menolak jika ciphertext dipindahkan ke kamar lain.
  3. **Manajemen Kunci Kriptografi Berkekuatan Tinggi (CSPRNG) & Gagal Tertutup (*Fail-Closed*):**  
     Menghilangkan risiko penggunaan kunci lemah atau *hardcoded*. Dibuat fungsi dan skrip `npm run generate:key` menggunakan `crypto.randomBytes(32)` (256-bit entropy dari kernel OS). Kunci dipisahkan ke file `.env` lokal di luar git, sedangkan file `.env.example` diproteksi hanya memakai string sintetis. Pada fungsi dekripsi, diterapkan arsitektur gagal tertutup di mana kesalahan tag, modifikasi ciphertext, atau kunci salah langsung melempar galat tertutup dan sama sekali tidak membocorkan *plaintext* parsial.
  4. **Pembersihan Dokumen KEPUTUSAN.md & Penyusunan Matriks Uji Otomatis:**  
     Memperbaiki dokumen keputusan teknis agar murni menyajikan arsitektur $\text{kebutuhan} \rightarrow \text{mekanisme} \rightarrow \text{alasan}$ sesuai permintaan soal (menghilangkan tabel meta rubrik penilaian), serta melengkapi berkas uji `__tests__/crypto_core.test.js` dengan 8 skenario komprehensif yang menguji kondisi positif dan penolakan berbagai kondisi tidak sah.
  5. **Audit Keamanan Repositori & Penerapan Data Sintetis (*Zero-Leakage*):**  
     Memastikan repositori GitHub bersih dari data pribadi (PII), password asli, maupun sertifikat kunci privat (`*.pem`/`*.key`), dengan mengaudit bahwa database seeder (`prisma/seed.ts`), mock data, dan unit test murni menggunakan nama, email, dan nomor telepon sintetis.
- Cara memeriksa:
  1. Menjalankan `npm test` untuk membuktikan 14/14 skenario uji lulus (termasuk verifikasi bahwa modifikasi data, tag, AAD, dan kunci salah ditolak secara tepat).
  2. Menjalankan `npm run generate:key` untuk memverifikasi pembangkitan kunci acak 64 karakter hex.
  3. Menjalankan `npx tsc --noEmit` untuk memastikan kesesuaian tipe data TypeScript pada Server Actions.
  4. Menjalankan `git check-ignore .env` dan `git ls-files .env` untuk memvalidasi bahwa kunci rahasia tidak pernah terlacak ke repositori publik.
