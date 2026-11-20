# Tugas Pendahuluan Modul 8: RESTful API dengan Route Handlers

- **Mata Kuliah:** Praktikum Pengembangan Aplikasi Web (052356)
- **Nama Mahasiswa:** Razqa Azaki
- **NIM:** 105224046
- **Projek:** R-Stay (Sistem Manajemen dan Reservasi Kos)
- **Tenggat Pengumpulan:** Jumat, 20 November 2026, 13.30 WIB

---

## 1. Tabel Endpoint RESTful API (`/api/v1`)

Berikut adalah perancangan 5 endpoint utama sistem reservasi kos **R-Stay** yang berada di bawah path `/api/v1`, merujuk pada dokumen kebutuhan [docs/kebutuhan.md](../kebutuhan.md):

| Metode | Path Endpoint | ID Kebutuhan | Deskripsi Fungsional | Semua Kemungkinan Kode Status HTTP |
| :---: | :--- | :---: | :--- | :--- |
| **GET** | `/api/v1/rooms` | `KEB-01` | Mengambil seluruh daftar kamar kos yang aktif beserta opsi filter tipe/harga. | `200 OK` (berhasil mengambil data),<br>`500 Internal Server Error` (koneksi database bermasalah). |
| **GET** | `/api/v1/rooms/[id]` | `KEB-02` | Mengambil rincian detail satu kamar kos berdasarkan ID atau slug unik. | `200 OK` (kamar ditemukan),<br>`400 Bad Request` (format ID tidak valid),<br>`404 Not Found` (kamar tidak ada di database),<br>`500 Internal Server Error`. |
| **POST** | `/api/v1/rooms` | `KEB-03` | Mendaftarkan kamar kos baru ke dalam sistem basis data. | `201 Created` (kamar baru tersimpan),<br>`400 Bad Request` (body bukan JSON / validasi data gagal),<br>`401 Unauthorized` (belum login),<br>`403 Forbidden` (bukan admin),<br>`409 Conflict` (slug kamar duplikat),<br>`500 Internal Server Error`. |
| **PATCH** | `/api/v1/rooms/[id]` | `KEB-04` | Memperbarui sebagian info kamar kos (misal mengganti status ketersediaan `isAvailable`). | `200 OK` (data kamar berhasil diperbarui),<br>`400 Bad Request` (validasi payload gagal),<br>`401 Unauthorized`,<br>`403 Forbidden`,<br>`404 Not Found` (kamar tidak ditemukan),<br>`500 Internal Server Error`. |
| **DELETE** | `/api/v1/rooms/[id]` | `KEB-05` | Menghapus data unit kamar kos dari sistem basis data. | `200 OK` / `204 No Content` (kamar sukses dihapus),<br>`401 Unauthorized`,<br>`403 Forbidden`,<br>`404 Not Found` (kamar tidak ditemukan),<br>`409 Conflict` (gagal hapus karena masih ada relasi sewa aktif),<br>`500 Internal Server Error`. |

---

## 2. Arti Aman (*Safe*) dan Idempoten (*Idempotent*) pada Metode HTTP

### A. Penjelasan Konsep Sederhana:
1. **Aman (*Safe*):**
   Metode HTTP disebut *Aman* apabila pemanggilannya **hanya membaca data** dan **sama sekali tidak mengubah isi database atau server**. 
   *Ibaratnya:* Seperti membaca buku menu makanan di kos; membacanya berulang kali tidak akan mengurangi persediaan makanan di dapur.
2. **Idempoten (*Idempotent*):**
   Metode HTTP disebut *Idempoten* apabila dipanggil **satu kali atau berkali-kali secara berurutan**, hasil akhir pada server **akan selalu sama**.
   *Ibaratnya:* Seperti menekan tombol lampu "Mati". Ditekan 1 kali atau ditekan 10 kali berturut-turut, kondisi akhirnya lampu tetap dalam keadaan mati.

### B. Karakteristik Metode HTTP pada Produk R-Stay:

| Metode | Aman? | Idempoten? | Alasan & Contoh Penerapan di R-Stay |
| :---: | :---: | :---: | :--- |
| **GET** | **Ya** | **Ya** | **Contoh:** `GET /api/v1/rooms`.<br>Hanya mengambil data kamar dari PostgreSQL. Berapa kali pun dipanggil, isi database tidak akan berubah dan responnya konsisten. |
| **POST** | **Tidak** | **Tidak** | **Contoh:** `POST /api/v1/reservations` (pengajuan sewa).<br>Setiap kali dipanggil, server membuat baris data reservasi baru dengan ID baru. Jika dikirim 3 kali, akan tercipta 3 pesanan sewa berbeda. |
| **PATCH** | **Tidak** | **Bisa Ya / Tergantung** | **Contoh:** `PATCH /api/v1/rooms/kost-001` dengan isi `{"isAvailable": false}`.<br>Tidak aman karena mengubah data kamar di database. Namun bersifat idempoten jika mengeset nilai pasti; mau dijalankan 1 kali atau 5 kali, status kamar tersebut tetap `false`. |
| **DELETE** | **Tidak** | **Ya** | **Contoh:** `DELETE /api/v1/rooms/kost-001`.<br>Tidak aman karena menghapus record dari database. Bersifat idempoten karena sekali kamar terhapus, panggilan berikutnya tidak mengubah kondisi akhir (kamar tersebut sudah hilang dari sistem). |

---

## 3. Penentuan Kode Status HTTP pada 4 Kasus Khusus

1. **Kasus 1: Body bukan JSON (misal teks rusak atau format data salah)**
   - **Kode Status:** `400 Bad Request`
   - **Alasan:** Server gagal membaca (*parse*) data yang dikirim karena sintaksnya cacat dan melanggar format JSON. Tanggung jawab pengiriman data valid ada pada sisi klien.

2. **Kasus 2: JSON valid, tetapi memuat kategori yang tidak dikenal (misal kategori diisi "Planet" padahal opsi hanya "Putra", "Putri", "Campur")**
   - **Kode Status:** `422 Unprocessable Content` (atau `400 Bad Request` pada validasi skema)
   - **Alasan:** Format JSON-nya secara teknis benar dan bisa dibaca server, tetapi isinya melanggar aturan bisnis atau semantik data sistem. Kode 422 merupakan standar tepat untuk payload yang lolos parsing tetapi gagal validasi logika.

3. **Kasus 3: ID kamar yang dicari tidak ada di database**
   - **Kode Status:** `404 Not Found`
   - **Alasan:** Permintaan diproses dengan benar oleh server, namun sumber daya (*resource*) kamar kos dengan identitas ID tersebut memang tidak ditemukan di basis data.

4. **Kasus 4: Menghapus item yang masih memiliki data relasi (misal kamar masih memiliki data penghuni atau riwayat reservasi aktif dengan aturan Restrict)**
   - **Kode Status:** `409 Conflict`
   - **Alasan:** Terjadi benturan (*conflict*) aturan integritas relasi pada database (Foreign Key Constraint). Permintaan tidak bisa dipenuhi sebelum data transaksi anak diselesaikan terlebih dahulu.

---

## 4. Format Respon Galat Problem Details (RFC 9457) Kasus 404

Standar modern **RFC 9457** (penyempurnaan RFC 7807) mewajibkan header `Content-Type: application/problem+json` dengan struktur informasi terstandarisasi agar klien/frontend dapat memahami detail galat secara seragam:

### Header Respons:
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
```

### Body Respons (JSON):
```json
{
  "type": "https://r-stay.my.id/errors/room-not-found",
  "title": "Kamar Kos Tidak Ditemukan",
  "status": 404,
  "detail": "Kamar kos dengan identitas 'kamar-singgah-999' tidak ditemukan di dalam sistem atau sudah dihapus.",
  "instance": "/api/v1/rooms/kamar-singgah-999",
  "timestamp": "2026-11-20T09:30:00.000Z"
}
```

*Penjelasan field standar RFC 9457:*
- `type`: Tautan URI dokumentasi yang menjelaskan jenis galat ini.
- `title`: Judul ringkas galat yang mudah dipahami manusia.
- `status`: Kode status HTTP resmi (`404`).
- `detail`: Informasi penjelasan kontekstual mengenai penyebab spesifik galat.
- `instance`: Alamat endpoint URI yang memicu munculnya galat tersebut.

---

## 5. Alasan `params` Harus di-Await dan Divalidasi pada Next.js 16

### A. Mengapa `params` Harus di-Await:
Pada Next.js 16 (App Router), parameter rute dinamis seperti `params` pada fungsi Route Handler:
```ts
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> })
```
didefinisikan sebagai objek **`Promise` (asinkron)**, bukan lagi objek biasa. 

*Alasannya:* Next.js 16 menggunakan arsitektur *Partial Prerendering (PPR)* dan streaming. Next.js memulai eksekusi jalur rute terlebih dahulu sebelum resolusi URL selesai sepenuhnya. Oleh karena itu, kita wajib menulis:
```ts
const { id } = await params;
```
Jika kita langsung mengakses `params.id` tanpa `await`, nilainya akan menghasilkan `undefined` atau memicu error peringatan fatal saat aplikasi di-build.

### B. Mengapa Nilai `id` Wajib Divalidasi Sebelum Masuk Kueri Prisma:
1. **Mencegah Kerusakan Server (*Crash Prevention*):** Jika pengguna mengirimkan nilai ID kosong, spasi acak, atau karakter aneh, kueri Prisma bisa melempar galat internal `PrismaClientKnownRequestError` yang menyebabkan server mengembalikan error 500 tidak ramah.
2. **Keamanan Lapisan Data (*Defense in Depth*):** Validasi mencegah nilai input yang tidak wajar diproses oleh driver database.
3. **Penyaringan Cepat (*Early Exit*):** Memvalidasi ID menggunakan pustaka seperti Zod di baris paling awal memungkinkan server langsung menolak input cacat dengan respon `400 Bad Request` tanpa membebani performa dan lalu lintas database PostgreSQL.

---

## Catatan Pemanfaatan AI
- **Alat Bantu AI:** Google Antigravity (DeepMind).
- **Bagian yang Dibantu:** Penataan pemetaan kode status HTTP, perumusan format standar respon RFC 9457 Problem Details, dan penyusunan penjelasan konsep aman/idempoten menggunakan perumpamaan sehari-hari yang mudah dipahami.
- **Verifikasi Jawaban:** Seluruh konsep teknis telah diverifikasi kesesuaiannya dengan spesifikasi resmi RFC 9457, dokumentasi Route Handler Next.js 16, dan skema database PostgreSQL Prisma pada repositori R-Stay.
