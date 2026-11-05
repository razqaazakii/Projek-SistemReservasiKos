import { Room } from '@/types/room';

export const roomsData: Room[] = [
  {
    id: 'kost-001',
    name: 'Kost Ajolie Executive',
    price: 1750000,
    location: 'Kebayoran Lama, Jakarta Selatan (Dekat ITC Permata Hijau & Univ. Pertamina)',
    type: 'Campur',
    size: '3 x 3 meter',
    facilities: [
      'AC Dingin',
      'Kamar Mandi Dalam (Shower & Kloset Duduk)',
      'WiFi Cepat Fiber Optic',
      'Kasur & Tempat Tidur Nyaman',
      'Lemari Pakaian',
      'Meja & Kursi Belajar/Kerja',
      'Dapur Bersama & Kulkas',
      'Akses Gerbang 24 Jam',
      'Area Parkir Motor Aman'
    ],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    description: 'Kost Ajolie berlokasi sangat strategis di Grogol Selatan, Kebayoran Lama, Jakarta Selatan. Akses sangat dekat dengan Universitas Pertamina, ITC Permata Hijau, Stasiun KRL Kebayoran, dan Halte Busway Transjakarta. Menawarkan kamar ber-AC dengan kamar mandi dalam, akses mandiri 24 jam, serta lingkungan hunian yang tenang dan nyaman untuk mahasiswa maupun karyawan.',
    rules: [
      'Maksimal 2 orang per kamar',
      'Akses gerbang keluar-masuk 24 jam bebas',
      'Dilarang membawa hewan peliharaan',
      'Wajib menjaga kebersihan fasilitas bersama dan ketenangan malam'
    ],
    rating: 4.9,
    specs: {
      size: '3 x 3 meter',
      bedType: 'Single Bed Premium (120x200)',
      electricity: 'Listrik Token Mandiri',
      bathroom: 'Kamar Mandi Dalam (Shower & Kloset Duduk)'
    }
  },
  {
    id: 'kost-002',
    name: 'Kost Putri Melati Cantika',
    price: 1850000,
    location: 'Setiabudi, Jakarta Selatan',
    type: 'Putri',
    size: '4 x 4 meter',
    facilities: [
      'AC Daikin Inverter',
      'Kamar Mandi Dalam',
      'Smart TV 32 Inch',
      'WiFi Fiber Optic 150 Mbps',
      'Dapur Bersama Lengkap',
      'Kulkas Bersama per Lantai',
      'Penjaga Kos 24 Jam',
      'Akses Sidik Jari Digital'
    ],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    description: 'Kos putri eksklusif di pusat perkantoran dengan fasilitas lengkap setaraf apartemen. Desain interior estetik bergaya Skandinavia yang terang dan nyaman untuk belajar maupun work from home.',
    rules: [
      'Khusus mahasiswi / karyawati wanita',
      'Tamu pria dilarang masuk area kamar (hanya di lobi utama)',
      'Jam malam pagar pukul 23.00 WIB',
      'Wajib menjaga kerapian fasilitas dapur bersama'
    ],
    rating: 4.8,
    specs: {
      size: '4 x 4 meter',
      bedType: 'Single Bed Premium (120x200)',
      electricity: 'Sudah Termasuk Listrik Standar',
      bathroom: 'Kamar Mandi Dalam + Water Heater'
    }
  },
  {
    id: 'kost-003',
    name: 'Kost Pavilion Harmoni Co-Living',
    price: 2200000,
    location: 'Coblong, Kota Bandung (Dekat Dago & ITB)',
    type: 'Campur',
    size: '4 x 5 meter',
    facilities: [
      'AC Panasonic',
      'Kamar Mandi Dalam Mewah',
      'Balkon Pribadi View Kota',
      'Co-working Space & Rooftop',
      'Layanan Laundry Gratis 15kg/bln',
      'WiFi Mesh Cepat',
      'Parkir Mobil Tertutup',
      'CCTV & Security 24 Jam'
    ],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
    description: 'Konsep hunian modern co-living bagi profesional muda dan mahasiswa pascasarjana. Menawarkan ruang bersosialisasi yang inspiratif, rooftop cafe, dan sirkulasi udara pegunungan Bandung yang sejuk.',
    rules: [
      'Wajib menunjukkan kartu identitas resmi / KTP',
      'Menghormati privasi penghuni lain',
      'Acara bersama rooftop wajib izin pengelola kos',
      'Dilarang mengadakan pesta atau kebisingan di atas jam 22.00'
    ],
    rating: 5.0,
    specs: {
      size: '4 x 5 meter',
      bedType: 'Queen Bed (160x200)',
      electricity: 'Token Listrik Mandiri',
      bathroom: 'Kamar Mandi Dalam (Water Heater & Wastafel)'
    }
  },
  {
    id: 'kost-004',
    name: 'Kost Putra Mahasiswa Barokah',
    price: 950000,
    location: 'Lowokwaru, Kota Malang (Dekat UB)',
    type: 'Putra',
    size: '3 x 3 meter',
    facilities: [
      'Kipas Angin Dinding',
      'Kamar Mandi Luar Bersih',
      'WiFi Kecepatan Tinggi',
      'Kasur Busa Tebal & Bantal',
      'Meja Belajar Kayu Jati',
      'Lemari Pakaian',
      'Dapur Bersama & Kompor Gas',
      'Parkir Motor Aman Berpagar'
    ],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    description: 'Pilihan hemat dan ramah kantong mahasiswa dengan lingkungan yang kondusif untuk belajar. Suasana sejuk Malang dan lokasi yang sangat dekat dengan halte transportasi umum serta pusat kuliner murah.',
    rules: [
      'Khusus mahasiswa putra',
      'Bebas jam malam dengan kunci gerbang masing-masing',
      'Jaga kebersihan dapur umum setelah memasak',
      'Dilarang merokok di area lorong bersama'
    ],
    rating: 4.6,
    specs: {
      size: '3 x 3 meter',
      bedType: 'Single Bed (100x200)',
      electricity: 'Termasuk Biaya Listrik & Air',
      bathroom: 'Kamar Mandi Luar (Rasio 1:2 Kamar)'
    }
  },
  {
    id: 'kost-005',
    name: 'Kost Puri Anggrek Residence',
    price: 1400000,
    location: 'Gubeng, Kota Surabaya (Dekat Kampus UNAIR)',
    type: 'Putri',
    size: '3.5 x 3.5 meter',
    facilities: [
      'AC Sharp Plasmacluster',
      'Kamar Mandi Dalam',
      'Lemari Cermin Full Body',
      'Meja Rias & Meja Kerja',
      'Koneksi Internet Dedicated',
      'Dispenser Air Minum Gratis',
      'Area Jemuran Luas Terbuka',
      'Penjaga Kos Siaga 24 Jam'
    ],
    isAvailable: false,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    description: 'Kos putri dengan standar keamanan prima dan lingkungan kekeluargaan yang hangat. Terletak di jalan utama yang terang dan aman dilalui kapan saja. Saat ini sedang penuh terisi.',
    rules: [
      'Wajib membawa identitas sah saat check-in',
      'Pintu gerbang ditutup pukul 22.30 WIB untuk keamanan',
      'Tidak diperkenankan membawa miras atau narkoba',
      'Tamu wanita menginap dikenakan biaya tambahan per malam'
    ],
    rating: 4.7,
    specs: {
      size: '3.5 x 3.5 meter',
      bedType: 'Single Bed (120x200)',
      electricity: 'Token Listrik Mandiri',
      bathroom: 'Kamar Mandi Dalam'
    }
  },
  {
    id: 'kost-006',
    name: 'Kost Cendana Executive Suites',
    price: 2500000,
    location: 'Tangerang Selatan, Banten (Dekat BSD City)',
    type: 'Campur',
    size: '5 x 5 meter',
    facilities: [
      'AC Inverter Hemat Energi',
      'Kamar Mandi Dalam + Bathtub Kecil',
      'Smart TV & Netflix Ready',
      'Kulkas Mini Pribadi',
      'Microwave & Pantry Kamar',
      'Gym & Kolam Renang Mini',
      'Access Card Elevator',
      'Parkir Mobil & Motor Gratis'
    ],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    description: 'Akomodasi premium bagi Anda yang mengutamakan privasi dan kenyamanan tingkat tinggi. Berlokasi strategis di kawasan bisnis BSD dengan akses mudah ke jalan tol dan pusat perbelanjaan modern.',
    rules: [
      'Penghuni wajib verifikasi identitas resmi',
      'Tamu boleh berkunjung dengan registrasi resepsionis',
      'Menjaga ketenangan pada jam istirahat malam',
      'Dilarang merusak furnitur atau perlengkapan kamar'
    ],
    rating: 5.0,
    specs: {
      size: '5 x 5 meter',
      bedType: 'King Size Bed (180x200)',
      electricity: 'Listrik Pascabayar Sesuai Meteran',
      bathroom: 'Kamar Mandi Dalam Mewah + Water Heater'
    }
  }
];
