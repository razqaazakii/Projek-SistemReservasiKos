# Dokumen Kebutuhan Perangkat Lunak (SRS)
## Projek: R-Stay (Sistem Manajemen & Reservasi Kos)

Dokumen ini memuat daftar kebutuhan fungsional sistem R-Stay yang menjadi acuan implementasi API dan antarmuka pengguna.

| ID Kebutuhan | Nama Kebutuhan | Deskripsi Fungsional | Aktor |
| :--- | :--- | :--- | :--- |
| **KEB-01** | Katalog & Pencarian Kamar Kos | Pengguna dapat melihat daftar seluruh kamar kos, memfilter berdasarkan tipe (Putra/Putri/Campur), dan mencari berdasarkan lokasi atau harga. | Publik / Penyewa |
| **KEB-02** | Detail Kamar Kos | Pengguna dapat melihat rincian fasilitas, spesifikasi ukuran, harga bulanan, aturan kos, ketersediaan, serta ulasan pada kamar tertentu. | Publik / Penyewa |
| **KEB-03** | Pendaftaran Kamar Baru | Pemilik kos atau admin dapat mendaftarkan unit kamar baru beserta foto, harga sewa, fasilitas, dan deskripsi ke sistem database. | Admin / Pemilik |
| **KEB-04** | Pembaruan Data & Ketersediaan Kamar | Pemilik kos atau admin dapat memperbarui informasi kamar atau mengubah status ketersediaan kamar (Tersedia / Penuh). | Admin / Pemilik |
| **KEB-05** | Penghapusan Unit Kamar Kos | Pemilik kos atau admin dapat menghapus unit kamar kos yang sudah tidak beroperasi dari sistem database. | Admin / Pemilik |
| **KEB-06** | Pengajuan Reservasi Sewa | Penyewa dapat mengajukan pemesanan sewa kamar kos dengan menentukan tanggal mulai sewa dan durasi sewa bulanan. | Penyewa |
| **KEB-07** | Pemberian Ulasan & Rating | Penyewa yang telah menempati kos dapat mengirimkan ulasan kepuasan dan rating bintang (1 - 5). | Penyewa |
