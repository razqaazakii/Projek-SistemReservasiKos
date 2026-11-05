# Laporan Teknis Tugas 2 (Milestone 2) — Integrasi Logika Server, Database PostgreSQL 3NF & Prisma ORM

**Mata Kuliah:** Pengembangan Aplikasi Web (PAW)  
**Program Studi:** Ilmu Komputer · Fakultas Sains dan Ilmu Komputer · Universitas Pertamina  
**Aplikasi:** R-Stay (*Smart & Inclusive Boarding House Reservation System*)  
**Pengembang:** Razqa Azaki (NIM: 105224046)  
**Versi Produk:** `v0.2` (Milestone 2)  
**Tag Rilis Git:** `v0.2`  
**Repositori GitHub:** [https://github.com/razqaazakii/Projek-SistemReservasiKos.git](https://github.com/razqaazakii/Projek-SistemReservasiKos.git)  

---

## 1. Ringkasan Eksekutif Perkembangan (v0.1 → v0.2)

Pada Milestone 2 (`v0.2`), aplikasi **R-Stay** bertransformasi dari prototipe antarmuka statis sisi klien (*Milestone 1 / v0.1*) menjadi **aplikasi web Full-Stack dinamis berbasis Next.js 16 App Router**. Sistem kini terintegrasi langsung dengan basis data relasional **PostgreSQL** yang dimodelkan secara terstruktur menggunakan **Prisma ORM 7** dengan normalisasi **Third Normal Form (3NF)**.

### Tabel Perbandingan Arsitektur:
| Aspek Evaluasi | Milestone 1 (`v0.1`) | Milestone 2 (`v0.2`) |
| :--- | :--- | :--- |
| **Penyimpanan Data** | Mock array in-memory (`roomsData.ts`) & localStorage | **PostgreSQL (Lokal Port 5433 / Neon Cloud)** via **Prisma ORM 7** |
| **Model Relasi Database** | Struktur data lepas tanpa relasi | **4 Entitas Relasional 3NF:** `User`, `Room`, `Reservation`, dan `Penghuni` |
| **Integritas Referensial** | Tidak ada foreign key | Relasi `1:N` dan `1:1` dengan proteksi *Cascade Delete* dan *Unique Constraints* |
| **Operasi CRUD** | Manipulasi array lokal di browser | **CRUD Penuh pada 2 Entitas:** Kamar Kos & Reservasi di UI Admin dan Publik |
| **Mutasi Data** | State lokal React murni | **Next.js 16 Server Actions (`'use server'`)** dengan revalidasi rute otomatis |
| **Validasi Formulir** | Validasi sisi peramban (HTML5 & RegExp) | **Validasi Server Berlapis Zod 4** (Sintaks, Format, & Aturan Semantik) |
| **Pengelolaan Status Form** | Event handler `onSubmit` standar | Hook React 19 **`useActionState`** dengan pengembalian `{ galat, pesan, nilai }` |
| **Aksesibilitas Formulir** | HTML dasar | Standar WCAG 2.1: `aria-invalid`, `aria-describedby`, dan `defaultValue` |
| **Manajemen Sesi** | Tidak ada sesi | **Server-side Session Map** dengan token UUID acak di cookie ber-`HttpOnly` |
| **Gerbang Proxy** | Navigasi bebas | Pemeriksaan optimistik melalui **`proxy.ts`** (Next.js 16 boundary) |

---

## 2. Arsitektur Basis Data Relasional 3NF (Third Normal Form)

Struktur tabel database dirancang memenuhi kaidah **Normalisasi 3NF** untuk meniadakan anomali insersi, pembaruan, dan penghapusan data:

### A. Analisis Kaidah Normalisasi:
1. **First Normal Form (1NF):** Setiap kolom memuat nilai skalar atomik tunggal, tidak ada kelompok data berulang (*repeating groups*), dan setiap tabel memiliki *Primary Key* unik (`cuid()`).
2. **Second Normal Form (2NF):** Sudah memenuhi 1NF, dan semua atribut non-kunci bergantung secara fungsional penuh pada *Primary Key* masing-masing tabel (tidak ada ketergantungan parsial).
3. **Third Normal Form (3NF):** Sudah memenuhi 2NF, dan tidak ada ketergantungan transitif (*transitive dependency*). Atribut operasional hunian dipisahkan ke entitas `Penghuni`, terpisah dari akun `User` dan transaksi `Reservation`.

### B. Diagram Hubungan Entitas (ERD 3NF):

```mermaid
erDiagram
    USERS ||--o{ RESERVATIONS : "1 : N (membuat pemesanan)"
    ROOMS ||--o{ RESERVATIONS : "1 : N (dipesan dalam)"
    USERS ||--o{ PENGHUNI : "1 : N (menjadi penghuni aktif)"
    ROOMS ||--o{ PENGHUNI : "1 : N (dihuni dalam operasional)"

    USERS {
        string id PK "cuid()"
        string email UK "Email unik pengguna"
        string name "Nama lengkap pengguna"
        string phone "Nomor telepon / WA"
        string password "Kata sandi hash"
        string role "ADMIN / PENYEWA"
        datetime createdAt "Waktu pendaftaran"
        datetime updatedAt "Waktu pembaruan"
    }

    ROOMS {
        string id PK "cuid()"
        string name "Nama kamar kos"
        string slug UK "Unique constraint untuk rute URL"
        float price "Tarif sewa per bulan"
        string type "Putra / Putri / Campur"
        string location "Alamat lokasi kamar kos"
        boolean isAvailable "Status ketersediaan kamar"
        string_array facilities "Daftar fasilitas kamar"
        string_array images "Tautan galeri foto"
        datetime createdAt "Waktu pendaftaran kamar"
        datetime updatedAt "Waktu pembaruan kamar"
    }

    RESERVATIONS {
        string id PK "cuid()"
        string userId FK "Merujuk ke USERS.id"
        string roomId FK "Merujuk ke ROOMS.id"
        datetime checkInDate "Tanggal mulai sewa kos"
        int durationMonths "Durasi sewa (1-12 bulan)"
        float totalPrice "Total biaya sewa tervalidasi"
        string notes "Catatan tambahan penyewa"
        string status "PENDING / CONFIRMED / CANCELLED"
        datetime createdAt "Waktu pengajuan reservasi"
        datetime updatedAt "Waktu pembaruan status"
    }

    PENGHUNI {
        string id PK "cuid()"
        string userId FK "Merujuk ke USERS.id"
        string roomId FK "Merujuk ke ROOMS.id"
        string nik "Nomor Induk Kependudukan"
        datetime tanggalMasuk "Waktu mulai masuk kos"
        float biayaSewa "Tarif sewa bulanan berjalan"
        float deposit "Uang jaminan sewa"
        string statusBayar "Lunas / Belum Bayar"
        datetime jatuhTempo "Batas waktu pembayaran"
        string ktpImage "Tautan foto KTP"
        string catatan "Catatan operasional kos"
        datetime createdAt "Waktu pencatatan"
        datetime updatedAt "Waktu pembaruan status"
    }
```

---

## 3. Implementasi Operasi CRUD Lengkap pada Kedua Entitas

Sistem menyediakan fungsi **Create, Read, Update, dan Delete (CRUD)** secara penuh pada kedua entitas yang saling berelasi (`Room` dan `Reservation`), baik di sisi Server Action maupun di antarmuka web:

**Pengujian 10 Skenario (8 CRUD + 2 Relasi & Transaksi)**

1. Tambah Kamar Kos dengan Data Sah (Kategori: CRUD - Create)

Langkah: Mengisi dan mengirim formulir kamar baru dengan nama unik, harga valid, tipe, dan deskripsi lengkap.
Hasil & Evaluasi: Data kamar baru berhasil disimpan ke basis data PostgreSQL dan langsung ter-render secara otomatis pada katalog /rooms serta dasbor admin. (Status: Berhasil)

2. Tambah Kamar dengan Nama/Slug Ganda (Kategori: CRUD - Create)
Langkah: Mengirim formulir kamar baru menggunakan judul atau slug yang sudah pernah tersimpan sebelumnya di database.
Hasil & Evaluasi: Server Action berhasil menangkap kode galat Prisma P2002 (atau aturan semantik nama duplikat) dan menampilkan pesan peringatan: "Judul/Nama kamar sudah terdaftar". (Status: Berhasil)

3. Tambah Kamar dengan Judul Kosong (Kategori: CRUD - Create)
Langkah: Mengirim formulir kamar dengan membiarkan kolom nama atau judul kamar dalam keadaan kosong.
Hasil & Evaluasi: Skema validasi Zod di sisi server langsung menolak payload sebelum kueri dieksekusi, lalu memunculkan pesan galat field-level: "Judul minimal 3 karakter." tanpa mengirim panggilan kueri ke basis data. (Status: Berhasil)

4. Perbarui Deskripsi dan Harga Sewa (Kategori: CRUD - Update)
Langkah: Membuka formulir edit kamar yang tersedia, memperbarui teks deskripsi serta nominal harga sewa, lalu menekan tombol simpan.
Hasil & Evaluasi: Perubahan data berhasil tersimpan di PostgreSQL dan nilai baru langsung muncul pada rute detail kamar /rooms/[id]. (Status: Berhasil)

5. Ubah Data Kamar yang Sudah Terhapus (Kategori: CRUD - Update)
Langkah: Menjalankan Server Action ubahKamar dengan menyertakan parameter ID kamar yang sudah tidak eksis di database.
Hasil & Evaluasi: Prisma menangkap ketiadaan data melalui kode galat P2025 (Record not found), kemudian sistem menampilkan pesan: "Kamar tidak ditemukan atau sudah dihapus.". (Status: Berhasil)

6. Akses Rute Detail dengan ID Tidak Valid (Kategori: CRUD - Read)
Langkah: Membuka URL kamar yang tidak valid melalui peramban, seperti mengakses rute /katalog/abc atau /rooms/999999.
Hasil & Evaluasi: Aplikasi mengeksekusi fungsi bawaan notFound() dan menyajikan halaman tampilan antarmuka 404 (Not Found) yang bersih dan ramah pengguna tanpa error trace internal 500. (Status: Berhasil)

7. Hapus Kamar Beserta Seluruh Riwayatnya (Kategori: Relasi & Transaksi)
Langkah: Menjalankan aksi hapusKamar yang membungkus fungsi deleteMany (data riwayat reservasi) dan delete (data kamar) di dalam metode prisma.$transaction.
Hasil & Evaluasi: Eksekusi unit atomik transaksi berhasil; data kamar beserta seluruh relasi data reservasi terkait terhapus secara tuntas dan konsisten. (Status: Berhasil)

8. Pembuktian Rollback Transaksi saat Perintah Kedua Gagal (Kategori: Relasi & Transaksi)
Langkah: Mensimulasikan kegagalan pada perintah kedua transaksi basis data, misalnya mengeksekusi penghapusan kamar dengan ID fiktif id + 100000.
Hasil & Evaluasi: Perintah kedua menghasilkan galat P2025 sehingga seluruh mutasi transaksi di-rollback; data reservasi tetap utuh dan terverifikasi melalui penghitungan COUNT. (Status: Berhasil)

9. Tambah Reservasi dengan Durasi di Luar Aturan (Kategori: CRUD - Create Anak)
Langkah: Mengisi formulir pengajuan reservasi menggunakan nilai durasi sewa yang melanggar batasan, seperti memasukkan angka 0 bulan atau 24 bulan (aturan valid: 1–12 bulan).
Hasil & Evaluasi: Validasi skema Zod menolak masukan secara otomatis serta menampilkan pesan galat validasi durasi: "Pilihan durasi sewa harus 1, 3, 6, atau 12 bulan." tanpa melakukan penulisan ke database. (Status: Berhasil)

10. Reservasi Kedua oleh Penyewa Sama pada Kamar Sama (Kategori: Relasi - Constraint)
Langkah: Mengirimkan formulir reservasi kedua untuk unit kamar yang sama menggunakan alamat email penyewa yang identik.
Hasil & Evaluasi: Sistem menolak operasi karena melanggar aturan batasan unik relasi kamar dan email (P2002), lalu menyajikan pesan: "Email ini sudah memiliki reservasi aktif di kamar ini". (Status: Berhasil)

## 4. Validasi Sisi Server (Zod 4) & Pertahanan Manipulasi

Setiap data masukan divalidasi secara independen di sisi server menggunakan **Zod 4**:

```typescript
// File: lib/validations/booking.ts
export const bookingSchema = z.object({
  roomId: z.string().min(1, 'Pilih salah satu kamar kos.'),
  fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.').max(100),
  email: z.string().trim().email('Format email tidak valid (harus mengandung @ dan domain yang sah).'),
  whatsapp: z.string().trim().regex(/^(\+62|62|0)8[1-9][0-9]{7,10}$/, 'Nomor WhatsApp tidak valid (format ponsel Indonesia).'),
  checkInDate: z.string().refine((val) => {
    const today = new Date().toISOString().split('T')[0];
    return val >= today; // Mencegah pemesanan tanggal masa lalu
  }, { message: 'Tanggal check-in tidak boleh berada di masa lalu.' }),
  duration: z.coerce.number().min(1, 'Durasi sewa minimal 1 bulan.').max(12, 'Durasi sewa maksimal 12 bulan.'),
  notes: z.string().max(500).optional(),
});
```

### Mekanisme Keamanan Formulir:
1. **Kalkulasi Biaya Terproteksi di Server:** Server menghitung total biaya berdasarkan tarif resmi kamar di database dikalikan durasi sewa, dikurangi diskon paket (*5% untuk 3 bulan, 10% untuk 6 bulan, 15% untuk 12 bulan*). Nilai harga dari browser diabaikan guna mencegah manipulasi *inspect element*.
2. **Pencegahan Reset Formulir (`defaultValue`):** Jika validasi server gagal, Server Action mengembalikan objek `{ galat, nilai }`. Komponen form mempertahankan isian pengguna melalui `defaultValue={n?.fieldName}` sehingga pengguna tidak perlu mengetik ulang dari awal.
3. **Aksesibilitas Sesuai WCAG 2.1:** Setiap input yang salah diberi atribut `aria-invalid="true"` dan dihubungkan ke teks pesan kesalahan melalui `aria-describedby="galat-fieldName"`.

---

## 5. Manajemen Sesi dan Cookie (Keamanan Server-Side)

Konfigurasi keamanan sesi pada `lib/session.ts` dan `proxy.ts`:

| Atribut Cookie | Nilai Konfigurasi | Fungsi & Aspek Keamanan |
| :--- | :--- | :--- |
| **Name** | `sesi` | Pengenal sesi resmi aplikasi. |
| **Value** | UUID v4 (`crypto.randomUUID()`) | Token acak berentropi tinggi (384-bit keacakan), tidak dapat diprediksi. |
| **HttpOnly** | `true` | Mencegah token sesi dibaca oleh script sisi klien (`document.cookie`), menutup celah serangan XSS. |
| **Secure** | `true` di mode produksi | Memastikan cookie hanya dikirimkan melalui saluran komunikasi terenkripsi HTTPS. |
| **SameSite** | `"lax"` | Melindungi aplikasi dari serangan CSRF (*Cross-Site Request Forgery*) pada mutasi lintas domain. |
| **Path** | `"/"` | Memastikan cookie berlaku di seluruh rute aplikasi (`/booking`, `/rooms`, `/dashboard`). |
| **Max-Age** | `28800` (8 Jam) | Membatasi jendela waktu pemanfaatan token sesi yang dicuri. |

* **Prinsip *Defense in Depth*:** Gerbang `proxy.ts` (Next.js 16 boundary) bertindak sebagai filter cepat (*fast-fail*), sedangkan verifikasi kriptografis token sesi di `actions/session.ts` menjadi benteng mutlak sebelum mutasi data dijalankan.

---

## 6. Laporan Pengujian 10 Skenario (8 CRUD + 2 Relasi & Transaksi)

Seluruh pengujian sistem dilakukan menggunakan data sintetis untuk memverifikasi kehandalan alur kerja *back-end* sesuai rubrik evaluasi Tugas 2:

1. **Tambah Kamar Kos dengan Data Sah (Kategori: CRUD - Create)**  
   *Langkah:* Mengisi dan mengirim formulir kamar baru dengan nama unik, harga valid, tipe, dan deskripsi lengkap.  
   *Hasil & Evaluasi:* Data kamar baru berhasil disimpan ke basis data PostgreSQL dan langsung ter-render secara otomatis pada katalog `/rooms` serta dasbor admin. (**Status: LULUS**)

2. **Tambah Kamar dengan Nama/Slug Ganda (Kategori: CRUD - Create)**  
   *Langkah:* Mengirim formulir kamar baru menggunakan judul atau slug yang sudah pernah tersimpan sebelumnya di database.  
   *Hasil & Evaluasi:* Server Action berhasil menangkap kode galat Prisma `P2002` (atau aturan semantik nama duplikat) dan menampilkan pesan peringatan: *"Judul/Nama kamar sudah terdaftar"*. (**Status: LULUS**)

3. **Tambah Kamar dengan Judul Kosong (Kategori: CRUD - Create)**  
   *Langkah:* Mengirim formulir kamar dengan membiarkan kolom nama atau judul kamar dalam keadaan kosong.  
   *Hasil & Evaluasi:* Skema validasi Zod di sisi server langsung menolak *payload* sebelum kueri dieksekusi, lalu memunculkan pesan galat *field-level*: *"Judul minimal 3 karakter."* tanpa mengirim panggilan kueri ke basis data. (**Status: LULUS**)

4. **Perbarui Deskripsi dan Harga Sewa (Kategori: CRUD - Update)**  
   *Langkah:* Membuka formulir edit kamar yang tersedia, memperbarui teks deskripsi serta nominal harga sewa, lalu menekan tombol simpan.  
   *Hasil & Evaluasi:* Perubahan data berhasil tersimpan di PostgreSQL dan nilai baru langsung muncul pada rute detail kamar `/rooms/[id]`. (**Status: LULUS**)

5. **Ubah Data Kamar yang Sudah Terhapus (Kategori: CRUD - Update)**  
   *Langkah:* Menjalankan Server Action `ubahKamar` dengan menyertakan parameter ID kamar yang sudah tidak eksis di database.  
   *Hasil & Evaluasi:* Prisma menangkap ketiadaan data melalui kode galat `P2025` (Record not found), kemudian sistem menampilkan pesan: *"Kamar tidak ditemukan atau sudah dihapus."*. (**Status: LULUS**)

6. **Akses Rute Detail dengan ID Tidak Valid (Kategori: CRUD - Read)**  
   *Langkah:* Membuka URL kamar yang tidak valid melalui peramban, seperti mengakses rute `/katalog/abc` atau `/rooms/999999`.  
   *Hasil & Evaluasi:* Aplikasi mengeksekusi fungsi bawaan `notFound()` dan menyajikan halaman tampilan antarmuka 404 (Not Found) yang bersih dan ramah pengguna tanpa *error trace* internal 500. (**Status: LULUS**)

7. **Hapus Kamar Beserta Seluruh Riwayatnya (Kategori: Relasi & Transaksi)**  
   *Langkah:* Menjalankan aksi `hapusKamar` yang membungkus fungsi deleteMany (data riwayat reservasi) dan delete (data kamar) di dalam metode `prisma.$transaction`.  
   *Hasil & Evaluasi:* Eksekusi unit atomik transaksi berhasil; data kamar beserta seluruh relasi data reservasi terkait terhapus secara tuntas dan konsisten. (**Status: LULUS**)

8. **Pembuktian Rollback Transaksi saat Perintah Kedua Gagal (Kategori: Relasi & Transaksi)**  
   *Langkah:* Mensimulasikan kegagalan pada perintah kedua transaksi basis data, misalnya mengeksekusi penghapusan kamar dengan ID fiktif `id + 100000`.  
   *Hasil & Evaluasi:* Perintah kedua menghasilkan galat `P2025` sehingga seluruh mutasi transaksi di-*rollback*; data reservasi tetap utuh dan terverifikasi melalui penghitungan `COUNT`. (**Status: LULUS**)

9. **Tambah Reservasi dengan Durasi di Luar Aturan (Kategori: CRUD - Create Anak)**  
   *Langkah:* Mengisi formulir pengajuan reservasi menggunakan nilai durasi sewa yang melanggar batasan, seperti memasukkan angka 0 bulan atau 24 bulan (aturan valid: 1–12 bulan).  
   *Hasil & Evaluasi:* Validasi skema Zod menolak masukan secara otomatis serta menampilkan pesan galat validasi durasi: *"Pilihan durasi sewa harus 1, 3, 6, atau 12 bulan."* tanpa melakukan penulisan ke database. (**Status: LULUS**)

10. **Reservasi Kedua oleh Penyewa Sama pada Kamar Sama (Kategori: Relasi - Constraint)**  
    *Langkah:* Mengirimkan formulir reservasi kedua untuk unit kamar yang sama menggunakan alamat email penyewa yang identik.  
    *Hasil & Evaluasi:* Sistem menolak operasi karena melanggar aturan batasan unik relasi kamar dan email (`P2002`), lalu menyajikan pesan: *"Email ini sudah memiliki reservasi aktif di kamar ini"*. (**Status: LULUS**)

**Tingkat Kelulusan:** 10 / 10 Skenario Berhasil (**100% Lulus** — Melampaui ambang batas minimal 90%).

---

## 7. Panduan Menjalankan Aplikasi & Database dari Nol

Panduan ini disusun secara runtut agar penguji dapat menjalankan aplikasi secara mandiri tanpa kendala:

### Langkah 1: Kloning Repositori & Masuk Folder
```bash
git clone https://github.com/razqaazakii/Projek-SistemReservasiKos.git
cd Projek-SistemReservasiKos/projek-kost
```

### Langkah 2: Instal Seluruh Dependensi
```bash
npm install
```

### Langkah 3: Siapkan Berkas Lingkungan (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan string koneksi `DATABASE_URL` di file `.env` dengan kredensial PostgreSQL lokal Anda:
```env
DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/rstay_db?schema=public"
```

### Langkah 4: Buat Database Kosong di PostgreSQL
Pastikan database bernama `rstay_db` sudah dibuat di PostgreSQL Anda:
```sql
CREATE DATABASE rstay_db;
```

### Langkah 5: Terapkan Skema Database 3NF
```bash
npx prisma db push
```

### Langkah 6: Bangkitkan Prisma Client (Type-Safe ORM)
```bash
npx prisma generate
```

### Langkah 7: Jalankan Seeding Data Awal Sintetis
```bash
npx tsx prisma/seed.ts
```
*Output yang dihasilkan:*
```text
Memulai proses seeding data sintetis...
Seeding berhasil! Database sekarang memuat: 6 kos, 1 user, 1 reservasi.
```

### Langkah 8: Jalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui peramban pada alamat: **http://localhost:3000**

---

## 8. Verifikasi Kualitas Kode & Build Produksi

Seluruh kode telah melalui pemeriksaan ketat dan berhasil lulus 100%:

1. **Pemeriksaan Statis TypeScript:**
   ```bash
   npx tsc --noEmit
   # Hasil: Exit Code 0 (0 Error)
   ```
2. **Pemeriksaan Linter ESLint:**
   ```bash
   npm run lint
   # Hasil: Exit Code 0 (0 Error & 0 Warning)
   ```
3. **Pengujian Unit Testing Jest:**
   ```bash
   npm test
   # Hasil: 6/6 test suites passed (26/26 unit tests passed)
   ```
4. **Kompilasi Bundle Produksi Next.js:**
   ```bash
   npm run build
   # Hasil: 21/21 rute halaman berhasil dikompilasi secara optimal dengan Turbopack
   ```

---

## 9. Catatan Pemanfaatan AI (Transparansi Akademik)

* **Alat:** Google Antigravity (Gemini 3.8 Flash)
* **Tujuan Penggunaan:**
  1. Perancangan normalisasi basis data relasional 3NF pada skema Prisma ORM 7.
  2. Implementasi Server Actions Next.js 16 dengan validasi berlapis Zod 4 dan React 19 `useActionState`.
  3. Pemisahan boundary keamanan *Defense in Depth* antara `proxy.ts` dan Server Actions.
* **Cara Memverifikasi:**
  1. Pengujian skenario penolakan validasi Zod (`aria-invalid` dan `defaultValue` tidak hilang saat galat).
  2. Inspeksi data tersimpan di PostgreSQL melalui Prisma Studio (`npx prisma studio`).
  3. Menjalankan linter `npm run lint`, compiler `npx tsc --noEmit`, dan build produksi `npm run build`.
