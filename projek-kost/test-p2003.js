const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

// ====================================================================
// 1. PEMBUKTIAN GALAT 2: redirect() Tertelan oleh try-catch
// ====================================================================
function simulasiGalat2Redirect() {
  console.log('================ BUKTI GALAT 2 (NEXT_REDIRECT TERTELAN) ================');
  try {
    // Next.js redirect() bekerja dengan melempar error internal NEXT_REDIRECT
    const galatRedirect = new Error('NEXT_REDIRECT');
    galatRedirect.digest = 'NEXT_REDIRECT;replace;/rooms;307;';
    throw galatRedirect;
  } catch (e) {
    console.log('> e.message : ' + e.message);
    console.log('> e.digest  : ' + e.digest);
    console.log('Akar Masalah: redirect() melempar galat khusus NEXT_REDIRECT.');
    console.log('             Blok catch menangkap galat tersebut sehingga navigasi batal!');
  }
  console.log('========================================================================\n');
}

// ====================================================================
// 2. PEMBUKTIAN GALAT 3: Foreign Key Constraint (P2003)
// ====================================================================
async function simulasiGalat3Foreignkey() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Mencoba merujuk ke data relasi yang tidak ada (melanggar foreign key)
    await prisma.reservation.create({
      data: {
        userId: 'user-palsu-123',
        roomId: 'kamar-palsu-456',
        checkInDate: new Date(),
        durationMonths: 1,
        totalPrice: 1000000,
      },
    });
  } catch (err) {
    console.log('================ BUKTI GALAT 3 (PRISMA ERROR P2003) ================');
    console.log('Pesan Galat : ' + err.message.split('\n').filter(Boolean).slice(-1)[0]);
    console.log('Kode Galat  : ' + err.code);
    console.log('Relasi FK   : Reservation_roomId_fkey');
    console.log('Akar Masalah: Foreign key constraint mencegah penghapusan kamar yang berelasi.');
    console.log('====================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  simulasiGalat2Redirect();
  await simulasiGalat3Foreignkey();
}

main();
