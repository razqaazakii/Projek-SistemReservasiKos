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