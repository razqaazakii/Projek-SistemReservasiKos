# Laporan Modul 04: Routing, Berkas Khusus, dan Komponen Next.js 

## 1. Peta Rute

### Tabel Pemetaan Rute Aplikasi
Berikut adalah seluruh pemetaan rute pada aplikasi Reservasi Kos R-Stay beserta jenis komponen dan berkas penyusunnya di dalam direktori `app/`:

| No | URL Rute | Berkas di `app/` | Jenis Rute | Isi & Peran Halaman |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `/` | `app/page.tsx` | Statis (Client Component) | Halaman beranda (*landing page*), banner hunian kos, ulasan fitur, serta cuplikan kamar unggulan. |
| 2 | `/rooms` | `app/rooms/page.tsx` | Statis (Client Component) | Katalog lengkap kamar kos dengan pencarian instan (*live search* nama/lokasi) dan filter kategori tipe kos (*Putra, Putri, Campur*). |
| 3 | `/rooms/[id]` | `app/rooms/[id]/page.tsx` | Dinamis (Server Component) | Halaman spesifikasi rinci kamar kos (harga, galeri foto, fasilitas, aturan sewa, dan tombol reservasi). Dilengkapi SSG (`generateStaticParams`). |
| 4 | `/booking` | `app/booking/page.tsx` | Statis (Client Component) | Formulir pengajuan sewa kamar, pemilihan durasi sewa, validasi data identitas penyewa, dan kalkulasi biaya. |
| 5 | `/pemesanan` | `app/pemesanan/page.tsx` | Statis (Alias Rute) | Rute alias yang mengekspor ulang rute `/booking` demi fleksibilitas navigasi pengguna berbahasa Indonesia. |
| 6 | `/dashboard/penyewa` | `app/dashboard/penyewa/page.tsx` | Statis (Client Component) | Dashboard penyewa untuk manajemen kamar yang dihuni, riwayat pembayaran, tiket komplain, dan profil penyewa. |
| 7 | `/login` | `app/(auth)/login/page.tsx` | Statis (Client Component) | Formulir otentikasi masuk pengguna dengan proteksi sesi peramban (*localStorage*). |
| 8 | `/register` | `app/(auth)/register/page.tsx` | Statis (Client Component) | Formulir pendaftaran akun penyewa baru. |
| 9 | `/profile` | `app/profile/page.tsx` | Statis (Client Component) | Halaman kartu identitas penyewa terotentikasi dan ringkasan preferensi kamar. |
| 10 | `/_not-found` | `app/not-found.tsx` | Khusus (Global Fallback) | Halaman penanganan status HTTP 404 ketika pengguna mengakses URL yang tidak terdaftar atau ID kamar tidak ditemukan. |

---

### Potongan Tabel Rute dari Keluaran `npm run build`
Hasil kompilasi produksi Next.js menggunakan Turbopack membuktikan seluruh rute berhasil terkompilasi secara statis maupun prerender:

```text
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /booking
├ ○ /dashboard
├ ○ /dashboard/penyewa
├ ○ /login
├ ○ /pemesanan
├ ○ /profile
├ ○ /register
├ ○ /rooms
└   /rooms/[id]
  ├ ◐ /rooms/[id]
  ├ ○ /rooms/kost-001
  ├ ○ /rooms/kost-002
  └ ◐ [+4 more paths]

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
```

## 2. Layout, Template, dan Berkas Khusus

### Pohon Folder `app/` Akhir
Struktur pohon berkas direktori `app/` yang telah dilengkapi seluruh berkas khusus (*special files*) sesuai konvensi Next.js:

```text
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── booking/
│   └── page.tsx
├── dashboard/
│   ├── penyewa/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── pemesanan/
│   └── page.tsx
├── profile/
│   └── page.tsx
├── rooms/
│   ├── [id]/
│   │   ├── error.tsx          <-- [Berkas Khusus Error Boundary]
│   │   ├── loading.tsx        <-- [Berkas Khusus Fallback Loading Skeleton]
│   │   └── page.tsx           <-- [Rute Dinamis Detail Kamar]
│   ├── page.tsx               <-- [Halaman Katalog Kamar]
│   └── template.tsx           <-- [Berkas Khusus Template Segmen Kamar]
├── favicon.ico
├── globals.css
├── layout.tsx                 <-- [Root Layout: Navbar & Footer Persisten]
├── not-found.tsx              <-- [Berkas Khusus Global 404 Error]
└── page.tsx                   <-- [Landing Page Utama]
```

---

### Hasil Uji Layout vs Template
* **Analisis Perilaku:**
  * **`layout.tsx` (Root):** Bersifat *persisten*. Elemen navigasi (Navbar dan status otentikasi akun) tidak pernah ter-render ulang saat bernavigasi antar halaman sehingga state peramban tetap terjaga utuh.
  * **`template.tsx` (`app/rooms/template.tsx`):** Bersifat *re-mounted*. Setiap kali pengunjung berpindah rute di dalam segmen kamar (misal dari `/rooms/kost-001` ke `/rooms/kost-002` atau ke `/rooms`), Next.js membuat instans DOM komponen baru dari nol sehingga state komponen di dalamnya otomatis ter-reset.

#### Bukti Tangkapan Layar Uji Layout vs Template:

**1. Kondisi Sebelum Navigasi (State Tersimpan):**  
![Layout vs Template Sebelum Navigasi](../../public/screenshots/layout-template-sebelum.png)  
*Penjelasan: Pengguna mengetik teks "Testing Template Kost 1" pada kotak input uji state di dalam template segmen kamar (`kost-002`). Nilai state teks masih tersimpan di memori komponen.*

**2. Kondisi Sesudah Navigasi (State Ter-reset Otomatis):**  
![Layout vs Template Sesudah Navigasi](../../public/screenshots/layout-template-sesudah.png)  
*Penjelasan: Saat pengguna berpindah ke kamar lain atau menekan tombol kembali ke katalog, seluruh instans template dibuat ulang (re-mounted) sehingga nilai input teks otomatis terhapus/kembali kosong secara alami.*

---

### Tangkapan Layar Hasil Uji `loading.tsx` dan `error.tsx`

#### 1. Berkas Khusus `loading.tsx` (`app/rooms/[id]/loading.tsx`)
Menyediakan antarmuka kerangka (*skeleton screen*) yang beranimasi `animate-pulse` menirukan tata letak detail kamar saat data atau parameter asinkron sedang diproses.

**a. Mode Pengembangan (Development):**  
![Loading Dev](../../public/screenshots/loading-dev.png)  
*Penjelasan: Tampilan skeleton loader aktif pada server lokal (dev) ketika rute kamar sedang diproses dan di-render secara on-demand.*

**b. Mode Produksi (Production):**  
![Loading Produksi](../../public/screenshots/loading-prod.png)  
*Penjelasan: Tampilan kerangka fallback instan disajikan kepada peramban melalui streaming SSR sebelum komponen halaman selesai dihidrasi di lingkungan produksi.*

#### 2. Berkas Khusus `error.tsx` (`app/rooms/[id]/error.tsx`)
Komponen Client Component bertindak sebagai *React Error Boundary* untuk menangkap kesalahan tak terduga pada rute kamar tanpa merusak antarmuka global aplikasi, serta menyediakan tombol `reset()` untuk mencoba memuat ulang segmen.

**a. Mode Pengembangan (Development):**  
![Error Dev](../../public/screenshots/error-dev.png)  
*Penjelasan: Error boundary di mode dev menangkap runtime exception dan menampilkan pesan error terisolasi beserta deskripsi kesalahan untuk memudahkan pelacakan oleh pengembang.*

**b. Mode Produksi (Production):**  
![Error Produksi](../../public/screenshots/error-prod.png)  
*Penjelasan: Tampilan kartu error di mode produksi menyajikan antarmuka ramah pengguna dengan tombol "Coba Muat Ulang" tanpa mengekspos stack trace sensitif sistem.*

---

## 3. Rute Dinamis dan Validasi `params`

### Tabel Pengujian Rute dan Validasi URL
Pengujian dilakukan menggunakan perintah `curl -I` dan penjelajahan langsung pada server:

| No | Target URL | Skenario Uji | Hasil yang Diharapkan | Hasil Aktual | Kode Status HTTP |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `/rooms/kost-001` | Akses ID kamar terdaftar (Putra Deluxe) | Halaman detail kamar tampil lengkap | Menampilkan rincian kamar Kost Griya Asri | `200 OK` |
| 2 | `/rooms/kost-002` | Akses ID kamar terdaftar (Putri Melati) | Halaman detail kamar tampil lengkap | Menampilkan rincian kamar Kost Putri Melati | `200 OK` |
| 3 | `/rooms/kost-999` | ID kamar numerik tidak terdaftar di sistem | Mengalihkan ke `notFound()` / 404 | Menampilkan `app/not-found.tsx` kustom | `404 Not Found` |
| 4 | `/rooms/KOST-001` | ID dengan huruf kapital (*case-sensitive check*) | Ditolak validasi / 404 | Menampilkan `app/not-found.tsx` kustom | `404 Not Found` |
| 5 | `/rooms/xyz-kamar` | Format slug ID salah | Ditolak validasi / 404 | Menampilkan `app/not-found.tsx` kustom | `404 Not Found` |
| 6 | `/rooms` | Akses rute induk segmen kamar | Menampilkan katalog kamar mandiri | Halaman katalog mandiri dengan search & filter | `200 OK` |

---

### Penjelasan Aturan Validasi `params`
Pada Next.js (versi 15/16), seluruh nilai parameter rute dinamis bertipe asinkron (`Promise<{ id: string }>`). Implementasi validasi di `app/rooms/[id]/page.tsx` dilakukan dengan tahapan ketat:

1. **Resolusi Asinkron:**
   Parameter wajib di-`await` sebelum dibaca:
   ```tsx
   export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
     const { id } = await params;
     // ...
   }
   ```
2. **Validasi Eksistensi Identitas Data:**
   Nilai string `id` dicocokkan secara eksak terhadap koleksi mock data `roomsData`:
   ```tsx
   const room = roomsData.find((r: Room) => r.id === id);
   ```
3. **Penanganan Kasus Tidak Valid (*Guard Clause*):**
   Jika parameter bernilai sembarang, memiliki format yang salah, atau ID tidak ditemukan dalam data, fungsi `notFound()` dari `next/navigation` dipanggil seketika:
   ```tsx
   if (!room) {
     notFound(); // Menghentikan eksekusi dan memicu app/not-found.tsx
   }
   ```
   Hal ini menjamin integritas aplikasi tetap aman dari *runtime crash* akibat akses properti objek `undefined`.

---

## 4. Pembagian Server dan Client Components

### Tabel Keputusan Komponen
Arsitektur pembagian komponen dirancang berdasarkan prinsip efisiensi bundle JavaScript dan kebutuhan interaktivitas pengguna:

| Komponen / Berkas | Jenis Komponen | Alasan Teknis & Pertimbangan Desain |
| :--- | :---: | :--- |
| `app/rooms/[id]/page.tsx` | **Server Component** | Tidak memerlukan hook interaktif (`useState`/`useEffect`). Memungkinkan pra-render static (*Static Site Generation*) via `generateStaticParams()`, menghemat ukuran bundle JS di sisi klien, dan meningkatkan performa SEO. |
| `app/rooms/[id]/error.tsx` | **Client Component** | Diwajibkan oleh konvensi Next.js (`'use client'`) karena harus menerima objek interaktif error dan mengeksekusi fungsi `reset()` di sisi peramban. |
| `app/rooms/template.tsx` | **Client Component** | Menangani siklus hidup re-instansiasi segmen kamar dan efek transisi navigasi klien. |
| `app/rooms/page.tsx` | **Client Component** | Memerlukan *state management* lokal (`useState`, `useMemo`) untuk memproses input pencarian teks secara instan dan manipulasi filter kategori kamar secara dinamis. |
| `app/booking/page.tsx` | **Client Component** | Mengelola formulir reservasi yang padat interaksi pengguna: validasi input formulir secara *real-time*, perhitungan kalkulasi total harga, dan pembacaan parameter URL query (`useSearchParams`). |
| `app/dashboard/penyewa/page.tsx` | **Client Component** | Menyediakan fitur interaktif manajemen penyewa: pergantian tab menu, modal popup formulir tambah penyewa, dan filter status sewa. |
| `app/layout.tsx` | **Server Component** | Menjadi kerangka utama aplikasi yang menyematkan metadata global, font Google (*Poppins*), dan struktur semantik HTML tanpa menambah beban komputasi di sisi klien. |

---

### Hasil Uji Impor Modul `server-only` dari Client Component
Untuk memastikan keamanan batas server–klien (*server-client boundary*), dibuat berkas layanan server khusus `lib/data.ts` yang memuat modul keamanan `server-only`:

```ts
// lib/data.ts
import 'server-only';
import { roomsData } from '@/data/roomsData';

export function getInternalRoomRecords() {
  return roomsData;
}
```

* **Skenario Pengujian Pelanggaran Batas:**
  Modul tersebut secara sengaja diimpor ke dalam komponen yang memiliki direktif `'use client'` (misal di `app/booking/page.tsx`).
* **Hasil Pengamatan Kompiler Next.js:**
  Proses kompilasi seketika diputus dan memunculkan error keamanan:
  ```text
  Error: You're importing a component that needs "server-only". That only works in a Server Component which is not the case here.
  ```
  *(Tangkapan layar bukti kegagalan build ini disematkan di bawah).*

![Uji Pembuktian server-only](../../public/screenshots/uji-server-only-error.png)

---

## 5. Verifikasi

Hasil eksekusi tiga perintah CLI utama pada proyek untuk membuktikan kesehatan kode:

### 1. Keluaran `npx tsc --noEmit` (Pemeriksaan Tipe TypeScript)
```text
$ npx tsc --noEmit
(Exited with code 0 - Tidak ditemukan satupun kesalahan tipe TypeScript)
```

### 2. Keluaran `npm run lint` / `npx eslint .` (Pemeriksaan Standar Kode)
```text
$ npx eslint .
(Exited with code 0 - Seluruh berkas memenuhi standar kode ESLint dan aturan React 19)
```

### 3. Keluaran `npm run build` (Build Produksi Turbopack)
```text
▲ Next.js 16.4.0 (Turbopack)
✓ Running next.config.ts took 3.4s
- Cache Components enabled
- Partial Prefetching enabled
✓ Compiled successfully in 20.0s
  Running TypeScript ...
  Finished TypeScript in 16.8s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (19/19) in 5.9s
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /booking
├ ○ /dashboard
├ ○ /dashboard/penyewa
├ ○ /login
├ ○ /pemesanan
├ ○ /profile
├ ○ /register
├ ○ /rooms
└   /rooms/[id]
  ├ ◐ /rooms/[id]
  ├ ○ /rooms/kost-001
  ├ ○ /rooms/kost-002
  └ ◐ [+4 more paths]

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
```

---

## 6. Kendala dan Penyelesaian

1. **Kendala Pengalihan Otomatis Rute Katalog:**
   * *Masalah:* Menekan menu "Katalog Kamar" sebelumnya selalu mengarahkan pengguna kembali ke halaman utama (`/`) karena `app/rooms/page.tsx` berisi fungsi `redirect('/')`.
   * *Penyelesaian:* Menghapus fungsi redirect dan membangun antarmuka mandiri `RoomsCatalogPage` pada `app/rooms/page.tsx` lengkap dengan pencarian dan filter kamar, sehingga rute `http://localhost:3000/rooms` dapat diakses secara independen.
2. **Ketiadaan Berkas Khusus untuk Pengujian Rubrik:**
   * *Masalah:* Proyek sebelumnya belum memiliki berkas `loading.tsx`, `error.tsx`, `not-found.tsx`, dan `template.tsx` sehingga kriteria penilaian bukti pengujian dan ketepatan teknis berpotensi tidak tercapai.
   * *Penyelesaian:* Dibuat berkas skeleton `app/rooms/[id]/loading.tsx`, error boundary `'use client'` `app/rooms/[id]/error.tsx`, halaman 404 kustom bertema R-Stay di `app/not-found.tsx`, serta template `app/rooms/template.tsx`.
3. **Peringatan Asinkronisasi Params pada Next.js 16:**
   * *Masalah:* Next.js 16 mengeluarkan catatan bahwa pembacaan parameter rute dinamis wajib di-`await`.
   * *Penyelesaian:* Mengonversi tipe prop `params` menjadi `Promise<{ id: string }>` dan mengeksekusi `await params` pada baris pertama fungsi komponen sebelum nilai ID diproses.

---

## 7. Catatan Pemanfaatan AI

Dokumentasi riwayat pemanfaatan AI selama pengerjaan Modul 04:

| No | Alat AI | Perintah Utama (*Prompt*) | Bagian yang Digunakan | Cara & Hasil Verifikasi Mandiri |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Google Antigravity | *"Bantu analisis struktur folder proyek R-Stay terhadap rubrik Bagian H modul 4 dan rancang berkas khusus yang belum ada."* | Arsitektur berkas `loading.tsx`, `error.tsx`, `not-found.tsx`, dan `template.tsx`. | Menginspeksi posisi folder rute secara manual, memverifikasi kesesuaian konvensi App Router Next.js, dan menjalankan `npx tsc --noEmit`. |
| 2 | Google Antigravity | *"Bagaimana cara mendemonstrasikan perbedaan nyata perilaku Layout vs Template yang bisa diobservasi di browser?"* | Pembuatan harness uji state interaktif pada komponen `template.tsx`. | Membuka rute kamar di browser, mengetik teks pada input state, berpindah ke rute kamar lain, dan memverifikasi bahwa state teks ter-reset secara otomatis. |
| 3 | Google Antigravity | *"Ubah rute app/rooms/page.tsx yang tadinya redirect ke beranda agar menjadi halaman katalog kamar mandiri dengan filter."* | Pembuatan antarmuka `RoomsCatalogPage` di `app/rooms/page.tsx`. | Menjalankan perintah `curl -I http://localhost:3000/rooms` (menghasilkan status HTTP 200 OK) dan menguji fitur live filter di antarmuka browser. |
| 4 | Google Antigravity | *"Buatkan skema uji server-only untuk membuktikan perlindungan batas server–klien."* | Implementasi modul data dengan deklarasi `import 'server-only'`. | Menguji secara sengaja impor modul ke komponen `'use client'`, memverifikasi kompilasi Next.js gagal dengan error boundary yang tepat. |
