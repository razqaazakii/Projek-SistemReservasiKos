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
