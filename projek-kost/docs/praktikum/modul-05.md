# Dokumen Teknis Modul 5 — Formulir, Validasi, Session, dan Cookie

**Nama/NIM** : Razqa Azaki / 105224046  
**Repositori** : https://github.com/razqaazakii/Projek-SistemReservasiKos.git  

---

## 1. Skema Validasi

### Tabel Kolom Formulir

| Nama Kolom | Aturan Zod | Pesan Galat |
| :--- | :--- | :--- |
| `name` | `trim().min(3).max(100)` | `"Judul minimal 3 karakter."` / `"Judul maksimal 100 karakter."` |
| `price` | `preprocess(numeric).min(100000).max(100000000)` | `"Harga sewa minimal Rp 100.000 per bulan."` / `"Harga sewa tidak valid."` |
| `type` | `z.enum(['Putra', 'Putri', 'Campur'])` | `"Pilih salah satu kategori."` |
| `location` | `trim().min(5)` | `"Lokasi kos minimal 5 karakter untuk kejelasan wilayah."` |
| `description` | `trim().min(10).max(300)` | `"Deskripsi minimal 10 karakter."` / `"Deskripsi maksimal 300 karakter."` |
| `facilities` | `array(z.string()).min(1)` | `"Minimal cantumkan 1 fasilitas kamar (contoh: AC, WiFi, Kasur)."` |
| `imageUrl` | `url().optional().or(literal(''))` | `"Format URL gambar tidak valid."` |

### Aturan Semantik di Server Action
* **Aturan:** Pemeriksaan keunikan nama kamar kos via query database (`prisma.room.findFirst`).
* **Pesan Galat:** `"Judul sudah dipakai item lain."`
* **Alasan:** Zod hanya memeriksa format teks, sedangkan keunikan data membutuhkan pengecekan langsung ke basis data PostgreSQL secara asinkron di server.

---

## 2. Alur Server Action

### Urutan Alur Eksekusi
1. **Sesi:** Cek `bacaSesi()`. Jika tidak sah/palsu, tolak: `"Silakan masuk terlebih dahulu."`.
2. **Validasi Bentuk:** Cek struktur payload via Zod `roomSchema.safeParse()`.
3. **Validasi Semantik:** Cek duplikasi nama kamar ke database PostgreSQL.
4. **Mutasi:** Simpan entitas kamar baru via `prisma.room.create()`.
5. **RevalidatePath:** Perbarui cache rute `/rooms`, `/dashboard/penyewa`, dan `/booking`.
6. **Redirect / Response:** Kembalikan status sukses ke klien.

### Pembagian Berkas
* **Server Component (`app/masuk/page.tsx`):** Render HTML awal di server dan membaca cookie rute.
* **Client Component (`app/katalog/tambah/page.tsx`):** State form, atribut `noValidate`, dan tampilan pesan galat.
* **Berkas `"use server"` (`actions/session.ts`, `actions/room.ts`):** Eksekusi verifikasi sesi, validasi Zod, dan mutasi basis data.

---

## 3. Bukti Uji Validasi

### 1. Validasi Format Email
![Format Email Tidak Valid](../../assets/modul_5/Format_emailNoValid.png)
* Input email tanpa format domain valid memicu galat Zod: *"Format email tidak valid."*.

### 2. Validasi Panjang Kata Sandi
![Kata Sandi Terlalu Pendek](../../assets/modul_5/Kata_Sandi_Terlalu_Pendek.png)
* Input kata sandi kurang dari 8 karakter memicu galat: *"Kata sandi minimal 8 karakter."*.

### 3. Validasi Kredensial Akun
![Kredensial Tidak Cocok](../../assets/modul_5/Kredensial_Tidak_Cocok.png)
* Kombinasi email/password salah memicu notifikasi penolakan: *"Email atau kata sandi salah."*.

### 4. Uji Bypass Validasi Klien (`noValidate`)
![Bypass Validasi Klien](../../assets/modul_5/Bypass_klien.png)
* Form dikirim dengan validasi browser dimatikan (`noValidate`). Server Action tetap berhasil memvalidasi dan memunculkan galat per-kolom dari server.

### 5. Uji Validasi Semantik
![Validasi Semantik](../../assets/modul_5/Validasi_semantik.png)
* Input nama kamar yang sudah terdaftar ditolak Server Action dengan pesan: *"Judul sudah dipakai item lain."*.

---

## 4. Session dan Cookie

### Atribut Cookie Sesi (`lib/session.ts`)
* `name`: `sesi` (Identifier cookie).
* `value`: `crypto.randomUUID()` (Opaque token acak).
* `path`: `/` (Berlaku di seluruh rute).
* `httpOnly`: `false` (Khusus pengujian praktikum agar dapat dimanipulasi di DevTools).
* `sameSite`: `'lax'` (Mencegah serangan CSRF).
* `maxAge`: `86400` (Kedaluwarsa otomatis dalam 24 jam).

### Tangkapan Layar DevTools
* **Panel Application:**  
  ![Panel Application Cookies](../../assets/modul_5/Cookie_palsu.png)  
  *(Cookie sesi tersimpan dengan format UUID acak).*
* **Header Set-Cookie:**  
  ![Header Set-Cookie](../../assets/modul_5/Bukti_logout.png)  
  *(Header HTTP `Set-Cookie` terkirim dari server).*

### Hasil Uji Sesi
1. **Cookie Palsu:** Nilai cookie diubah manual ke `sesi-palsu-12345`. Server Action menolak dengan galat *"Silakan masuk terlebih dahulu."* karena token tidak ada di memori server.
2. **Logout:** Tombol logout memanggil `hapusSesiAction()`, menghapus UUID dari memori server dan menghapus cookie peramban.
3. **Cookie Lama:** Menggunakan kembali nilai UUID lama setelah logout ditolak karena sesi di server sudah dihapus permanen.

---

## 5. Keputusan Teknis

### Session di Server vs Token di Cookie
* **Revokasi Instan:** Sesi di server dapat dicabut seketika saat logout, berbeda dengan JWT stateless yang tetap aktif hingga kedaluwarsa.
* **Minimasi Data:** Cookie hanya membawa UUID acak tanpa mengekspos payload data sensitif pengguna.

### Peran `proxy.ts` vs Pemeriksaan di Server Action
* **`proxy.ts` (Edge Middleware):** Penjaga pintu optimistik (*fast-fail*). Hanya mengecek keberadaan kunci cookie `sesi` tanpa kueri database lambat.
* **Server Action:** Otoritas mutlak (*defense-in-depth*). Memvalidasi keaslian UUID ke state server dan memeriksa izin akses sebelum mutasi.

---

## 6. Kendala dan Penyelesaian

* **Sesi In-Memory Terhapus saat HMR:**
  * *Kendala & Sebab:* Kompilasi ulang Next.js dev server mereset variabel modul memori.
  * *Solusi:* Menyimpan referensi map sesi pada objek global `globalThis.serverSessionMap`.
* **Input Angka Terbaca String oleh Zod:**
  * *Kendala & Sebab:* Elemen `<input>` selalu mengembalikan string.
  * *Solusi:* Memakai fungsi transform `z.preprocess()` untuk konversi aman ke tipe `number`.
* **Validasi Browser Menghalangi Uji Server:**
  * *Kendala & Sebab:* Tooltip bawaan HTML memblokir submit form.
  * *Solusi:* Menyematkan atribut `noValidate` pada tag `<form>`.

---

## 7. Catatan Pemanfaatan AI

* **Alat:** Antigravity (Gemini 3.8 Flash)
* **Perintah Utama:**
  1. Merancang arsitektur keamanan *defense-in-depth* (pemisahan boundary `proxy.ts` dan validasi mutlak `actions/session.ts`).
  2. Mengatasi reset penyimpanan memori sesi akibat Hot Module Replacement (HMR) menggunakan `globalThis`.
  3. Menyusun alur validasi Server Action berlapis (sanitasi Zod, pencegahan bypass `noValidate`, dan validasi semantik Prisma).
* **Bagian yang Digunakan:** `lib/session.ts`, `actions/session.ts`, `proxy.ts`, `lib/validations/room.ts`.
* **Cara Memverifikasi:**
  1. Uji injeksi cookie palsu di DevTools (Server Action berhasil menolak).
  2. Uji *replay attack* dengan token lama pasca logout (berhasil ditolak).
  3. Uji *bypass* formulir `noValidate` dan cek statis `npx tsc --noEmit`.
