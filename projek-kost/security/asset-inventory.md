# Inventaris Aset: R-Stay Property & Operations Management System

## 1. Pendahuluan
Dokumen *Asset Inventory* ini memuat daftar inventaris seluruh aset penting yang terdapat pada aplikasi pengelolaan properti dan kos **R-Stay**. Identifikasi aset ini mencakup komponen data, perangkat lunak, hingga infrastruktur server. Setiap aset dinilai berdasarkan tiga dimensi keamanan informasi standar CIA (*Confidentiality, Integrity, Availability*), yang disertai dengan penjelasan alasan penilaian berdasarkan kondisi nyata operasional sistem yang berjalan.

## 2. Tabel Inventaris Aset dan Penilaian CIA

| ID Aset | Nama Aset / Komponen | Jenis Aset | C | I | A | Alasan Penilaian CIA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AST-01** | Kredensial Pengguna (Password Hash) | Data / Secrets | Tinggi | Tinggi | Sedang | Kerahasiaan wajib dijaga mutlak untuk mencegah pembobolan akun, integritas penting agar hash sandi terhindar dari manipulasi, serta ketersediaan cukup fleksibel karena akun bisa dipulihkan melalui admin. |
| **AST-02** | Sesi Autentikasi JWT (JSON Web Token) | Data / Secrets | Tinggi | Tinggi | Tinggi | Kerahasiaan diperlukan agar token aman dari pencurian, integritas menjaga keabsahan hak akses secara presisi, dan ketersediaan wajib selalu stabil agar pengguna tidak terlempar keluar saat bernavigasi. |
| **AST-03** | Dokumen Foto KTP Penyewa | Data Sensitif (PII) | Tinggi | Tinggi | Sedang | Kerahasiaan sangat krusial demi melindungi privasi individu dari paparan publik, integritas memastikan keaslian berkas tanpa modifikasi, dan ketersediaan dibutuhkan sewaktu-waktu saat proses verifikasi sewa. |
| **AST-04** | Data Profil & Kontak Penyewa | Data | Tinggi | Sedang | Sedang | Kerahasiaan menjaga kerahasiaan nomor WhatsApp penghuni, integritas penting agar informasi tagihan tersampaikan secara akurat, dan ketersediaan diperlukan untuk kelancaran komunikasi harian. |
| **AST-05** | Data Keuangan & Transaksi Sewa | Data / Keuangan | Tinggi | Tinggi | Tinggi | Kerahasiaan melindungi perputaran arus kas bisnis, integritas mutlak untuk mencegah manipulasi nominal pembayaran, dan ketersediaan wajib diakses setiap saat guna menyusun laporan finansial. |
| **AST-06** | Basis Data Utama (Database Storage) | Infrastruktur / Data | Tinggi | Tinggi | Tinggi | Kerahasiaan mencegah pencurian seluruh data master, integritas menghindari risiko korupsi data sistem, dan ketersediaan harus aktif 24/7 agar operasional aplikasi tidak terhenti. |
| **AST-07** | Antarmuka Frontend (Next.js) | Software / Frontend | Rendah | Tinggi | Tinggi | Kerahasiaan rendah karena basis kode bersifat terbuka, integritas penting untuk menangkal penyisipan skrip berbahaya (XSS), dan ketersediaan memastikan layanan selalu siap diakses publik. |
| **AST-08** | Layanan Backend API & Server | Software / Backend | Sedang | Tinggi | Tinggi | Kerahasiaan melindungi alur logika utama, integritas mencegah eksekusi instruksi ilegal, dan ketersediaan wajib terjaga agar seluruh fitur merespons dengan optimal. |
| **AST-09** | Integrasi WhatsApp Gateway API | Layanan Eksternal | Sedang | Tinggi | Sedang | Kerahasiaan menjaga keamanan token akses layanan, integritas memastikan isi pesan pengingat terkirim utuh tanpa cacat, dan ketersediaan penting guna mendukung pengiriman pesan tepat waktu. |
