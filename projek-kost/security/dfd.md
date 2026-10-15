# Diagram Aliran Data (DFD): R-Stay

## 1. Pendahuluan
Dokumen ini memuat Diagram Aliran Data (DFD) Level 0 untuk produk **R-Stay**. Diagram ini dirancang dengan tata letak vertikal (*portrait*) yang terstruktur lurus dan rapi guna memetakan seluruh interaksi pengguna, proses inti sistem, tempat penyimpanan data, batas kepercayaan, serta penandaan aset yang dilindungi menggunakan mekanisme kriptografi.

## 2. Diagram Aliran Data (DFD)

```mermaid
flowchart LR
    %% Entitas Eksternal
    E01["E01 - Penyewa"]
    E02["E02 - Admin / Pengelola"]
    E03["E03 - WA Gateway API"]

    %% TB-1: Klien / Browser
    subgraph TB1["TB-1 - Browser Pengguna"]
        P01["P01 - Antarmuka Next.js"]
        D01[("D01 - Cookies / localStorage<br/>(Token Sesi JWT)")]
    end

    %% TB-2: Lingkungan Server
    subgraph TB2["TB-2 - Server Aplikasi R-Stay"]
        P02["P02 - Endpoint API<br/>(Kamar, Penghuni, Keuangan)"]
        P03["P03 - lib/auth.ts<br/>(Autentikasi & Otorisasi)"]
        P04["P04 - lib/crypto.ts<br/>(Kriptografi)"]
        P05["P05 - lib/audit.ts<br/>(Pencatatan Aktivitas)"]
    end

    %% TB-3: Basis Data Utama
    subgraph TB3["TB-3 - Penyimpanan Server"]
        D02[("D02 - Database PostgreSQL<br/>KTP terenkripsi AES-256<br/>Password hash Bcrypt/Argon2<br/>Catatan Transaksi & Audit")]
    end

    %% TB-4: Kredensial Server (Rahasia)
    subgraph TB4["TB-4 - Konfigurasi Rahasia"]
        D03[("D03 - Environment secrets")]
    end

    %% Aliran Data (Flows)
    E01 -->|"F01 - Input dan interaksi"| P01
    E02 -->|"F02 - Kelola kos & validasi"| P01
    P01 <-->|"F03 - Simpan atau muat token JWT"| D01
    P01 <-->|"F04 - Permintaan dan respons HTTP"| P02
    
    P02 <-->|"F05 - Pemeriksaan autentikasi & peran"| P03
    P03 <-->|"F06 - Akun dan password hash"| D02
    D03 -->|"F07 - Secret JWT"| P03
    
    P02 <-->|"F08 - Operasi kriptografi KTP"| P04
    D03 -->|"F09 - Secret kunci enkripsi"| P04
    P04 <-->|"F10 - Baca/tulis KTP terenkripsi"| D02
    
    P02 <-->|"F11 - Operasi CRUD Kamar & Transaksi"| D02
    P02 -->|"F12 - Aktivitas sensitif yang dicatat"| P05
    P05 -->|"F13 - Catatan audit (Audit Trail)"| D02
    
    D03 -->|"F14 - API Key WA Gateway"| P02
    P02 -->|"F15 - Pemicu tagihan otomatis"| E03
    E03 -->|"F16 - Pesan WhatsApp"| E01
```

## 3. Penjelasan Alur dan Komponen Diagram

Diagram di atas menguraikan bagaimana data mengalir dari pengguna menuju pusat penyimpanan sistem R-Stay secara sistematis:

### A. Pihak yang Terlibat (Entitas Eksternal)

1. **EE-01 (Penyewa):** Pengguna akhir yang mengakses sistem melalui jaringan publik untuk memantau informasi sewa dan menerima pesan pengingat tagihan.
2. **EE-02 (Admin / Pengelola):** Pengguna dengan hak akses tinggi yang mengelola data master kamar, mendaftarkan penghuni, serta memvalidasi transaksi keuangan kos.
3. **EE-03 (WA Gateway):** Layanan pihak ketiga eksternal yang berfungsi menjembatani pengiriman pesan teks pengingat tagihan ke nomor WhatsApp penghuni.

### B. Batas Keamanan Jaringan (Trust Boundaries)

1. **Batas Kepercayaan 1 (Jaringan Publik / Internet):** Zona luar yang tidak tepercaya. Seluruh komunikasi data yang berasal dari area ini wajib dienkripsi menggunakan protokol **HTTPS** demi mencegah penyadapan informasi.
2. **Batas Kepercayaan 2 (Lingkungan Internal R-Stay):** Zona internal aplikasi tempat pemrosesan logika dan penyimpanan basis data dikendalikan secara ketat oleh server.

### C. Proses Utama Sistem (Processes)

1. **PR-01 (Autentikasi & Otorisasi):** Berfungsi memeriksa kecocokan data masuk (*login*) serta mengelola sesi aktif pengguna.
2. **PR-02 (Manajemen Kamar):** Bertanggung jawab atas pengelolaan ketersediaan unit kamar, pendataan penghuni baru, dan penyimpanan berkas identitas.
3. **PR-03 (Proses Keuangan):** Mengatur perhitungan tagihan bulanan, pencatatan status pembayaran, serta memicu pengiriman notifikasi penagihan.

### D. Tempat Penyimpanan Data & Perlindungan Kriptografi (Data Stores)

Komponen yang diberi tanda **(C)** merupakan penyimpanan data yang diamankan menggunakan mekanisme kriptografi:

1. **DS-01 (Kredensial & Sesi - C):** Menyimpan kata sandi pengguna dalam bentuk *hash* yang aman (menggunakan fungsi *slow hash*) serta mengamankan token sesi aktif.
2. **DS-02 (Data Penghuni & KTP - C):** Menyimpan data biodata serta berkas foto kartu identitas (KTP) penghuni yang dilindungi dengan enkripsi saat disimpan di server (*Encryption at-Rest*).
3. **DS-03 (Data Keuangan):** Menyimpan rekam jejak transaksi pembayaran sewa kos dan status pelunasan secara berkala.
