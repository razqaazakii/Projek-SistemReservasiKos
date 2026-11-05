import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Memulai proses seeding data sintetis...')

    // 1. Masukkan Seluruh 6 Data Kos Resmi R-Stay (Sesuai Beranda)
    const rooms = [
        {
            slug: 'kost-001',
            name: 'Kost Ajolie Executive',
            price: 1750000,
            type: 'Campur',
            location: 'Kebayoran Lama, Jakarta Selatan (Dekat ITC Permata Hijau & Univ. Pertamina)',
            isAvailable: true,
            facilities: [
                'AC Dingin',
                'Kamar Mandi Dalam (Shower & Kloset Duduk)',
                'WiFi Cepat Fiber Optic',
                'Kasur & Tempat Tidur Nyaman',
                'Lemari Pakaian',
                'Meja & Kursi Belajar/Kerja',
                'Dapur Bersama & Kulkas',
                'Akses Gerbang 24 Jam',
                'Area Parkir Motor Aman',
            ],
            images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'],
        },
        {
            slug: 'kost-002',
            name: 'Kost Putri Melati Cantika',
            price: 1850000,
            type: 'Putri',
            location: 'Setiabudi, Jakarta Selatan',
            isAvailable: true,
            facilities: [
                'AC Daikin Inverter',
                'Kamar Mandi Dalam',
                'Smart TV 32 Inch',
                'WiFi Fiber Optic 150 Mbps',
                'Dapur Bersama Lengkap',
                'Kulkas Bersama per Lantai',
                'Penjaga Kos 24 Jam',
                'Akses Sidik Jari Digital',
            ],
            images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'],
        },
        {
            slug: 'kost-003',
            name: 'Kost Pavilion Harmoni Co-Living',
            price: 2200000,
            type: 'Campur',
            location: 'Coblong, Kota Bandung (Dekat Dago & ITB)',
            isAvailable: true,
            facilities: [
                'AC Panasonic',
                'Kamar Mandi Dalam Mewah',
                'Balkon Pribadi View Kota',
                'Co-working Space & Rooftop',
                'Layanan Laundry Gratis 15kg/bln',
                'WiFi Mesh Cepat',
                'Parkir Mobil Tertutup',
                'CCTV & Security 24 Jam',
            ],
            images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80'],
        },
        {
            slug: 'kost-004',
            name: 'Kost Putra Mahasiswa Barokah',
            price: 950000,
            type: 'Putra',
            location: 'Lowokwaru, Kota Malang (Dekat UB)',
            isAvailable: true,
            facilities: [
                'Kipas Angin Dinding',
                'Kamar Mandi Luar Bersih',
                'WiFi Kecepatan Tinggi',
                'Kasur Busa Tebal & Bantal',
                'Meja Belajar Kayu Jati',
                'Lemari Pakaian',
                'Dapur Bersama & Kompor Gas',
                'Parkir Motor Aman Berpagar',
            ],
            images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'],
        },
        {
            slug: 'kost-005',
            name: 'Kost Puri Anggrek Residence',
            price: 1400000,
            type: 'Putri',
            location: 'Gubeng, Kota Surabaya (Dekat Kampus UNAIR)',
            isAvailable: false,
            facilities: [
                'AC Sharp Plasmacluster',
                'Kamar Mandi Dalam',
                'Lemari Cermin Full Body',
                'Meja Rias & Meja Kerja',
                'Koneksi Internet Dedicated',
                'Dispenser Air Minum Gratis',
                'Area Jemuran Luas Terbuka',
                'Penjaga Kos Siaga 24 Jam',
            ],
            images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
        },
        {
            slug: 'kost-006',
            name: 'Kost Cendana Executive Suites',
            price: 2500000,
            type: 'Campur',
            location: 'Tangerang Selatan, Banten (Dekat BSD City)',
            isAvailable: true,
            facilities: [
                'AC Inverter Hemat Energi',
                'Kamar Mandi Dalam + Bathtub Kecil',
                'Smart TV & Netflix Ready',
                'Kulkas Mini Pribadi',
                'Microwave & Pantry Kamar',
                'Gym & Kolam Renang Mini',
                'Access Card Elevator',
                'Parkir Mobil & Motor Gratis',
            ],
            images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'],
        },
    ]

    for (const r of rooms) {
        await prisma.room.upsert({
            where: { slug: r.slug },
            update: {
                name: r.name,
                price: r.price,
                type: r.type,
                location: r.location,
                isAvailable: r.isAvailable,
                facilities: r.facilities,
                images: r.images,
            },
            create: {
                name: r.name,
                slug: r.slug,
                price: r.price,
                type: r.type,
                location: r.location,
                isAvailable: r.isAvailable,
                facilities: r.facilities,
                images: r.images,
            },
        })
    }

    // 2. Masukkan Data Pengguna Sintetis (User 3NF)
    const userAhmad = await prisma.user.upsert({
        where: { email: 'ahmad.fauzi@sintetis.ac.id' },
        update: {
            name: 'Ahmad Fauzi',
            phone: '081234567890',
            role: 'PENYEWA',
        },
        create: {
            email: 'ahmad.fauzi@sintetis.ac.id',
            name: 'Ahmad Fauzi',
            phone: '081234567890',
            password: 'penyewa123',
            role: 'PENYEWA',
        },
    })

    // 3. Masukkan 1 Contoh Data Reservasi Berelasi (Kamar 1: Kost Ajolie Executive)
    const ajolie = await prisma.room.findUnique({ where: { slug: 'kost-001' } })
    if (ajolie) {
        const existingReservation = await prisma.reservation.findFirst({
            where: {
                userId: userAhmad.id,
                roomId: ajolie.id,
            },
        })

        if (!existingReservation) {
            await prisma.reservation.create({
                data: {
                    userId: userAhmad.id,
                    roomId: ajolie.id,
                    checkInDate: new Date('2026-11-01'),
                    durationMonths: 3,
                    totalPrice: ajolie.price * 3,
                    notes: 'Mohon siapkan kamar lantai dasar dekat jendela.',
                    status: 'CONFIRMED',
                },
            })
        }
    }

    const jRoom = await prisma.room.count()
    const jUser = await prisma.user.count()
    const jRes = await prisma.reservation.count()

    console.log(`Seeding berhasil! Database sekarang memuat: ${jRoom} kos, ${jUser} user, ${jRes} reservasi.`)
}

main()
    .catch((e) => {
        console.error('Gagal melakukan seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
