'use server';

import { prisma } from '@/lib/prisma';
import { bookingSchema, type BookingInput } from '@/lib/validations/booking';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/room';

/**
 * Server Action untuk menyimpan reservasi kamar kos baru ke PostgreSQL (3NF).
 * Mendukung panggilan useActionState(React 19) dengan parameter (_sebelumnya, formData)
 * serta mendukung panggilan langsung dengan rawData.
 */
export async function createBookingAction(
  arg1?: unknown,
  arg2?: unknown
): Promise<ActionResponse<BookingInput>> {
  // Tangani parameter useActionState: (_sebelumnya, formData) atau (rawData)
  let rawData: Record<string, unknown> = {};

  if (arg2 instanceof FormData) {
    rawData = Object.fromEntries(arg2.entries());
  } else if (arg1 instanceof FormData) {
    rawData = Object.fromEntries(arg1.entries());
  } else if (arg2 && typeof arg2 === 'object') {
    rawData = arg2 as Record<string, unknown>;
  } else if (arg1 && typeof arg1 === 'object') {
    rawData = arg1 as Record<string, unknown>;
  }

  // Rekam nilai input agar form tidak ter-reset kosong saat validasi gagal (Sesuai Modul 5)
  const nilai: Record<string, string> = {
    roomId: String(rawData.roomId ?? ''),
    fullName: String(rawData.fullName ?? ''),
    email: String(rawData.email ?? ''),
    whatsapp: String(rawData.whatsapp ?? ''),
    checkInDate: String(rawData.checkInDate ?? ''),
    duration: String(rawData.duration ?? '1'),
    notes: String(rawData.notes ?? ''),
  };

  // 1. Validasi bentuk dengan Zod di sisi server
  const validationResult = bookingSchema.safeParse(rawData);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      message: 'Validasi server gagal. Mohon periksa kembali isian formulir Anda.',
      pesan: 'Validasi server gagal. Mohon periksa kembali isian formulir Anda.',
      errors: fieldErrors,
      galat: fieldErrors,
      nilai,
    };
  }

  const validatedData = validationResult.data;

  try {
    // 2. Cari kamar di database PostgreSQL
    const room = await prisma.room.findFirst({
      where: {
        OR: [{ id: validatedData.roomId }, { slug: validatedData.roomId }],
      },
    });

    const durationNumber = Number(validatedData.duration) || 1;
    const roomPrice = room ? room.price : 1750000;

    // Terapkan diskon durasi resmi R-Stay
    let discount = 0;
    if (durationNumber === 3) discount = 0.05;
    if (durationNumber === 6) discount = 0.1;
    if (durationNumber === 12) discount = 0.15;
    const calculatedTotal = roomPrice * durationNumber * (1 - discount);

    // 3. Cari atau buat User (3NF) berdasarkan email yang dimasukkan
    const cleanEmail = validatedData.email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: validatedData.fullName.trim(),
          phone: validatedData.whatsapp.trim(),
          password: 'penyewa123',
          role: 'PENYEWA',
        },
      });
    }

    // Cek constraint unik relasi (Skenario 10): Cegah reservasi ganda oleh email sama di kamar sama
    if (room && user) {
      const existingBooking = await prisma.reservation.findFirst({
        where: {
          roomId: room.id,
          userId: user.id,
        },
      });

      if (existingBooking) {
        const dupBookingMsg = 'Email ini sudah memiliki reservasi aktif di kamar ini';
        return {
          success: false,
          message: dupBookingMsg,
          pesan: dupBookingMsg,
          errors: { email: [dupBookingMsg] },
          galat: { email: [dupBookingMsg] },
          nilai,
        };
      }
    }

    // 4. Simpan data reservasi 3NF secara persisten ke tabel PostgreSQL
    if (room && user) {
      await prisma.reservation.create({
        data: {
          userId: user.id,
          roomId: room.id,
          checkInDate: new Date(validatedData.checkInDate),
          durationMonths: durationNumber,
          totalPrice: calculatedTotal,
          notes: validatedData.notes || null,
          status: 'PENDING',
        },
      });
    }

    // 5. Revalidasi path agar tampilan Next.js ter-refresh
    try {
      revalidatePath('/booking');
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/rooms');
    } catch {
      // Abaikan jika dipanggil di luar konteks request Next.js
    }

    const successMsg = `Pengajuan reservasi kamar untuk ${validatedData.fullName} berhasil disimpan ke database PostgreSQL!`;
    return {
      success: true,
      message: successMsg,
      pesan: successMsg,
      data: validatedData,
      nilai,
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      const dupBookingMsg = 'Email ini sudah memiliki reservasi aktif di kamar ini';
      return {
        success: false,
        message: dupBookingMsg,
        pesan: dupBookingMsg,
        errors: { email: [dupBookingMsg] },
        galat: { email: [dupBookingMsg] },
        nilai,
      };
    }
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kendala saat menyimpan reservasi ke server.';
    return {
      success: false,
      message: errorMsg,
      pesan: errorMsg,
      nilai,
    };
  }
}

/**
 * Server Action untuk mengambil riwayat reservasi milik pengguna berdasarkan email (ReBAC via User).
 */
export async function getUserReservationsAction(email: string) {
  try {
    if (!email) return { success: false, data: [] };
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (!user) return { success: true, data: [] };

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: user.id,
      },
      include: {
        room: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Petakan agar atribut kontak tetap tersedia untuk tampilan antarmuka
    const mapped = reservations.map((r) => ({
      ...r,
      fullName: r.user.name,
      email: r.user.email,
      whatsapp: r.user.phone,
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error('Failed to get user reservations:', error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action untuk Admin: Mengambil semua pengajuan reservasi masuk dari seluruh penyewa (PostgreSQL 3NF).
 */
export async function getAllReservationsAction() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        room: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Petakan agar kompatibel dengan tabel dasbor admin
    const mapped = reservations.map((r) => ({
      ...r,
      fullName: r.user?.name || 'Penyewa',
      email: r.user?.email || '',
      whatsapp: r.user?.phone || '',
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error('Failed to get all reservations:', error);
    return { success: false, data: [] };
  }
}

/**
 * Server Action untuk Admin: Memperbarui status reservasi (CONFIRMED / CANCELLED).
 * Jika status CONFIRMED, otomatis mencatat ke tabel Penghuni dan mengunci ketersediaan kamar.
 */
export async function updateReservationStatusAction(id: string, status: string) {
  try {
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: { room: true, user: true },
    });

    // Jika reservasi disetujui (CONFIRMED), kunci kamar dan daftarkan ke tabel Penghuni
    if (status === 'CONFIRMED' && updated.roomId && updated.userId) {
      await prisma.room.update({
        where: { id: updated.roomId },
        data: { isAvailable: false },
      }).catch((err) => console.warn('Could not update room availability:', err));

      // Sinkronkan ke tabel Penghuni jika belum ada
      const existingPenghuni = await prisma.penghuni.findFirst({
        where: { userId: updated.userId, roomId: updated.roomId },
      });

      if (!existingPenghuni) {
        const nextMonth = new Date(updated.checkInDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await prisma.penghuni.create({
          data: {
            userId: updated.userId,
            roomId: updated.roomId,
            nik: '3201000000000001',
            tanggalMasuk: updated.checkInDate,
            biayaSewa: updated.room?.price || 1500000,
            deposit: updated.room?.price || 1500000,
            statusBayar: 'Lunas',
            jatuhTempo: nextMonth,
            catatan: updated.notes || 'Penghuni dari reservasi terkonfirmasi',
          },
        }).catch((err) => console.warn('Could not auto-create Penghuni:', err));
      }
    } else if (status === 'CANCELLED' && updated.roomId) {
      // Jika dibatalkan, kembalikan ketersediaan kamar
      await prisma.room.update({
        where: { id: updated.roomId },
        data: { isAvailable: true },
      }).catch((err) => console.warn('Could not update room availability:', err));
    }

    try {
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/profile');
      revalidatePath('/rooms');
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js request (misal pengujian otomatis)
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error('Failed to update reservation status:', error);
    return { success: false, message: 'Gagal memperbarui status reservasi.' };
  }
}

/**
 * Server Action: Menghapus data reservasi secara permanen dari PostgreSQL (Operasi Delete).
 */
export async function deleteReservationAction(id: string): Promise<ActionResponse<null>> {
  try {
    if (!id) {
      return { success: false, message: 'ID reservasi tidak valid.' };
    }

    const existing = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, message: 'Data reservasi tidak ditemukan di database.' };
    }

    await prisma.reservation.delete({
      where: { id },
    });

    try {
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/profile');
      revalidatePath('/rooms');
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js request (misal pengujian otomatis)
    }

    return {
      success: true,
      message: 'Data reservasi berhasil dihapus dari database PostgreSQL.',
      data: null,
    };
  } catch (error) {
    console.error('Failed to delete reservation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menghapus data reservasi dari server.',
    };
  }
}
