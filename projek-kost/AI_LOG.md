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
- Tujuan: Mengimplementasikan enkripsi terautentikasi (AEAD) berbasis AES-256-GCM untuk melindungi kerahasiaan dan integritas data produk kamar kos, mendokumentasikan parameter kriptografi (panjang kunci 256-bit, nonce 96-bit, AAD context binding, auth tag 128-bit), menerapkan penanganan masukan fail-closed dan manajemen kunci CSPRNG di luar repository, menyusun dokumen KEPUTUSAN.md, mengembangkan skenario uji otomatis dengan Jest, dan menyiapkan rilis tag v0.2.
- Prompt ringkas: "Tugas 2 — Enkripsi Terautentikasi dan Integritas Data (Kriptografi) dengan ketentuan KEPUTUSAN.md (kebutuhan -> mekanisme -> alasan), parameter terdokumentasi (panjang kunci, nonce/IV unik, AAD, tag), kunci CSPRNG di luar repository, validasi fail-closed, minimal 4 skenario uji, AI_LOG.md tanpa secret, dan tag v0.2."
- Bagian yang dipakai: `lib/crypto_core.js`, `lib/crypto_core.d.ts`, `actions/room.ts`, `package.json`, `.env.example`, `.env`, `__tests__/crypto_core.test.js`, `KEPUTUSAN.md`, `README.md`.
- Yang diubah:
  1. Menambahkan fungsi AEAD AES-256-GCM (`generateAeadKey`, `encryptProductAead`, `decryptProductAead`, `encryptProductData`, `decryptProductData`, `decryptProductDataJson`, `serializeAeadPayload`, `deserializeAeadPayload`) di `lib/crypto_core.js` dengan modul bawaan terstandar `node:crypto`.
  2. Menerapkan pengikatan konteks data produk via Additional Authenticated Data (AAD) untuk mencegah serangan pemindahan ciphertext antar kamar kos (*context-swap attack*).
  3. Menerapkan penanganan masukan ketat dan perilaku gagal tertutup (*fail-closed*): sistem melempar galat penolakan dan tidak pernah membocorkan plaintext parsial apabila ciphertext diubah, tag diubah, AAD tidak cocok, atau kunci salah.
  4. Menyiapkan skrip npm `generate:key` untuk pembangkitan kunci CSPRNG 256-bit dan memisahkan penyimpanan kunci ke `.env` yang dikecualikan di `.gitignore` (hanya placeholder sintetis di `.env.example`).
  5. Menghubungkan Server Actions `encryptProductNotesAction` dan `decryptProductNotesAction` di `actions/room.ts`.
  6. Menyusun 8 skenario uji otomatis di `__tests__/crypto_core.test.js` yang menguji kondisi positif dan penolakan kondisi tidak sah (seluruh 14 pengujian lulus).
  7. Menyusun dokumen arsitektur komprehensif `KEPUTUSAN.md` mencakup alur kebutuhan → mekanisme → alasan, dokumentasi 4 parameter, matriks uji, serta panduan demonstrasi 3 menit.
- Cara memeriksa: Menjalankan `npm test` (14/14 unit test lulus dalam 0.66 detik), menjalankan `npm run generate:key` (berhasil menghasilkan kunci acak 64 karakter hex), menjalankan `npx tsc --noEmit` (0 error tipe), dan memverifikasi `git check-ignore .env` (kunci tersimpan aman di luar repositori).
