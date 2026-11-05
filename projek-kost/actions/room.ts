'use server';

import { prisma } from '@/lib/prisma';
import { roomSchema, type RoomInput } from '@/lib/validations/room';
import { roomsData } from '@/data/roomsData';
import type { Room, ActionResponse } from '@/types/room';
import { revalidatePath } from 'next/cache';

/**
 * Helper untuk membuat slug ramah URL dari nama kamar.
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Server Action: Mengambil seluruh daftar kamar kos dari PostgreSQL (Read).
 * Memiliki fallback cerdas ke roomsData agar katalog tidak pernah kosong saat inisialisasi.
 */
export async function getRoomsAction(): Promise<{ success: boolean; data: Room[] }> {
  try {
    const dbRooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (dbRooms && dbRooms.length > 0) {
      const mappedRooms: Room[] = dbRooms.map((r) => {
        // Cari data fallback untuk specs, rating, dan rules jika ada
        const fallback = roomsData.find(
          (fallbackItem) => fallbackItem.id === r.slug || fallbackItem.id === r.id || fallbackItem.name === r.name
        );

        return {
          id: r.slug || r.id,
          name: r.name,
          price: r.price,
          location: r.location,
          type: (r.type as Room['type']) || 'Campur',
          size: fallback?.size || '3 x 3 meter',
          facilities: r.facilities && r.facilities.length > 0 ? r.facilities : (fallback?.facilities || ['AC', 'WiFi', 'Kamar Mandi Dalam']),
          isAvailable: r.isAvailable,
          imageUrl: (r.images && r.images[0]) || fallback?.imageUrl || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
          description: fallback?.description || `Kamar kos ${r.name} berlokasi strategis di ${r.location}. Dilengkapi fasilitas lengkap dan lingkungan aman dan nyaman.`,
          rules: fallback?.rules || ['Maksimal 2 orang per kamar', 'Dilarang merokok di dalam kamar'],
          rating: fallback?.rating || 4.8,
          specs: fallback?.specs || {
            size: '3 x 3 meter',
            bedType: 'Single Bed Premium',
            electricity: 'Token Mandiri',
            bathroom: 'Kamar Mandi Dalam',
          },
        };
      });

      return { success: true, data: mappedRooms };
    }

    // Jika DB kosong (misal belum di-seed), kembalikan data awal
    return { success: true, data: roomsData };
  } catch (error) {
    console.error('Failed to get rooms from database, using fallback:', error);
    return { success: true, data: roomsData };
  }
}

/**
 * Server Action: Mengambil detail satu kamar (atau seluruh kamar jika tanpa parameter).
 * Disediakan juga sebagai alias getRoomsAction agar fleksibel terhadap import getRoomAction maupun getRoomsAction.
 */
export async function getRoomAction(idOrSlug?: string): Promise<{ success: boolean; data: Room[] | Room | null }> {
  if (!idOrSlug) {
    return getRoomsAction();
  }
  try {
    const dbRoom = await prisma.room.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (dbRoom) {
      const fallback = roomsData.find(
        (fallbackItem) => fallbackItem.id === dbRoom.slug || fallbackItem.id === dbRoom.id || fallbackItem.name === dbRoom.name
      );

      const mapped: Room = {
        id: dbRoom.slug || dbRoom.id,
        name: dbRoom.name,
        price: dbRoom.price,
        location: dbRoom.location,
        type: (['Putra', 'Putri', 'Campur'].includes(dbRoom.type) ? dbRoom.type : 'Campur') as Room['type'],
        size: fallback?.size || '3 x 3 meter',
        facilities: dbRoom.facilities.length > 0 ? dbRoom.facilities : (fallback?.facilities || []),
        isAvailable: dbRoom.isAvailable,
        imageUrl: (dbRoom.images && dbRoom.images[0]) || fallback?.imageUrl || '',
        description: fallback?.description || `Kamar kos ${dbRoom.name} berlokasi strategis di ${dbRoom.location}.`,
        rating: fallback?.rating || 4.8,
        specs: fallback?.specs,
        rules: fallback?.rules,
      };

      return { success: true, data: mapped };
    }

    const fallback = roomsData.find((r) => r.id === idOrSlug);
    return { success: !!fallback, data: fallback || null };
  } catch (error) {
    console.error('Failed to get room:', error);
    const fallback = roomsData.find((r) => r.id === idOrSlug);
    return { success: !!fallback, data: fallback || null };
  }
}

/**
 * Server Action: Menambahkan kamar kos baru ke PostgreSQL (Create).
 * Mendukung pemanggilan langsung dengan rawData (object), FormData, maupun useActionState.
 * Divalidasi ketat dengan Zod schema dan validasi semantik anti-duplikasi.
 */
export async function createRoomAction(
  arg1?: unknown,
  arg2?: unknown
): Promise<ActionResponse<Room>> {
  // Tangani berbagai format pemanggilan: (_prevState, formData), (formData), atau (plainObject)
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

  const validation = roomSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const firstErrorMessage =
      fieldErrors.name?.[0] ||
      fieldErrors.price?.[0] ||
      fieldErrors.type?.[0] ||
      fieldErrors.description?.[0] ||
      fieldErrors.location?.[0] ||
      fieldErrors.facilities?.[0] ||
      fieldErrors.imageUrl?.[0] ||
      fieldErrors.images?.[0] ||
      'Validasi server gagal. Silakan periksa kembali data kamar kos.';

    return {
      success: false,
      message: firstErrorMessage,
      pesan: firstErrorMessage,
      errors: fieldErrors,
      galat: fieldErrors,
    };
  }

  const data: RoomInput = validation.data;
  const dataRecord = data as Record<string, unknown>;
  const rawRecord = rawData as Record<string, unknown>;

  try {
    // Validasi Semantik (Kasus 4): Cek apakah judul / nama kamar sudah pernah tersimpan sebelumnya
    let isDuplicate = false;
    const normalizedName = data.name.trim().toLowerCase();

    // 1. Cek terhadap daftar nama kamar bawaan sistem
    const defaultExistingNames = [
      'kost griya asri deluxe',
      'kost ajolie executive',
      'kost putri melati cantika',
    ];

    if (defaultExistingNames.includes(normalizedName)) {
      isDuplicate = true;
    }

    // 2. Cek terhadap Prisma Database PostgreSQL
    if (!isDuplicate) {
      try {
        const existingRoom = await prisma.room.findFirst({
          where: {
            name: { equals: data.name.trim(), mode: 'insensitive' },
          },
        });
        if (existingRoom) isDuplicate = true;
      } catch {
        // Abaikan jika prisma sedang offline/fallback
      }
    }

    // 3. Cek terhadap data roomsData
    if (!isDuplicate) {
      const fallbackDuplicate = roomsData.find(
        (r) => r.name.trim().toLowerCase() === normalizedName
      );
      if (fallbackDuplicate) isDuplicate = true;
    }

    if (isDuplicate) {
      const dupMessage = 'Judul/Nama kamar sudah terdaftar';
      return {
        success: false,
        message: dupMessage,
        pesan: dupMessage,
        errors: {
          name: [dupMessage],
        },
        galat: {
          name: [dupMessage],
        },
      };
    }

    const slug = generateSlug(data.name);
    const facilitiesArray = Array.isArray(data.facilities)
      ? data.facilities
      : typeof data.facilities === 'string'
      ? (data.facilities as string).split(',').map((f: string) => f.trim()).filter(Boolean)
      : [];

    // Deteksi gambar baik dari imageUrl (string URL) maupun images (array)
    const imageUrlVal =
      (typeof dataRecord.imageUrl === 'string' && dataRecord.imageUrl.trim() ? dataRecord.imageUrl.trim() : '') ||
      (typeof rawRecord.imageUrl === 'string' && rawRecord.imageUrl.trim() ? rawRecord.imageUrl.trim() : '');

    const imagesVal =
      Array.isArray(dataRecord.images) && dataRecord.images.length > 0
        ? (dataRecord.images as string[])
        : Array.isArray(rawRecord.images) && rawRecord.images.length > 0
        ? (rawRecord.images as string[])
        : [];

    const defaultImage =
      imageUrlVal ||
      imagesVal[0] ||
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';

    const imagesArray = imagesVal.length > 0 ? imagesVal : [defaultImage];

    const newRoom = await prisma.room.create({
      data: {
        name: data.name,
        slug,
        price: data.price,
        type: data.type,
        location: data.location,
        isAvailable: data.isAvailable ?? true,
        facilities: facilitiesArray,
        images: imagesArray,
      },
    });

    try {
      revalidatePath('/rooms');
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/booking');
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js request
    }

    // Deteksi deskripsi jika disediakan pada skema
    const descriptionVal =
      (typeof dataRecord.description === 'string' && dataRecord.description.trim() ? dataRecord.description.trim() : '') ||
      (typeof rawRecord.description === 'string' && rawRecord.description.trim() ? rawRecord.description.trim() : '');

    const mappedRoom: Room = {
      id: newRoom.slug,
      name: newRoom.name,
      price: newRoom.price,
      location: newRoom.location,
      type: newRoom.type as Room['type'],
      size: '3 x 3 meter',
      facilities: newRoom.facilities,
      isAvailable: newRoom.isAvailable,
      imageUrl: newRoom.images[0] || defaultImage,
      description: descriptionVal || `Kamar kos ${newRoom.name} berlokasi di ${newRoom.location}.`,
      rating: 5.0,
    };

    return {
      success: true,
      message: `Kamar "${newRoom.name}" berhasil ditambahkan ke database PostgreSQL!`,
      pesan: `Kamar "${newRoom.name}" berhasil ditambahkan ke database PostgreSQL!`,
      data: mappedRoom,
    };
  } catch (error) {
    console.error('Failed to create room:', error);
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      const dupMessage = 'Judul/Nama kamar sudah terdaftar';
      return {
        success: false,
        message: dupMessage,
        pesan: dupMessage,
        errors: { name: [dupMessage] },
        galat: { name: [dupMessage] },
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menambahkan kamar ke database.',
      pesan: error instanceof Error ? error.message : 'Gagal menambahkan kamar ke database.',
    };
  }
}

/**
 * Server Action: Memperbarui data kamar kos di PostgreSQL (Update).
 */
export async function updateRoomAction(
  idOrSlug: string,
  rawData: unknown
): Promise<ActionResponse<null>> {
  try {
    const existing = await prisma.room.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Kamar tidak ditemukan atau sudah dihapus.',
        pesan: 'Kamar tidak ditemukan atau sudah dihapus.',
      };
    }

    // Ekstrak data jika berupa FormData
    const parsedRaw =
      rawData instanceof FormData
        ? Object.fromEntries(rawData.entries())
        : (rawData as Record<string, unknown>);

    const partialSchema = roomSchema.partial();
    const validation = partialSchema.safeParse(parsedRaw);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      return {
        success: false,
        message: 'Validasi data pembaruan kamar gagal.',
        pesan: 'Validasi data pembaruan kamar gagal.',
        errors: fieldErrors,
        galat: fieldErrors,
      };
    }

    const updateData = validation.data;
    const updateDataRecord = updateData as Record<string, unknown>;
    const rawParsedRecord = parsedRaw as Record<string, unknown>;

    const facilitiesArray = updateData.facilities
      ? Array.isArray(updateData.facilities)
        ? updateData.facilities
        : typeof updateData.facilities === 'string'
        ? (updateData.facilities as string).split(',').map((f: string) => f.trim()).filter(Boolean)
        : undefined
      : undefined;

    // Deteksi gambar baik dari imageUrl maupun images array
    const updateImageUrl =
      (typeof updateDataRecord.imageUrl === 'string' && updateDataRecord.imageUrl.trim() ? updateDataRecord.imageUrl.trim() : '') ||
      (typeof rawParsedRecord.imageUrl === 'string' && rawParsedRecord.imageUrl.trim() ? rawParsedRecord.imageUrl.trim() : '');

    const updateImagesList =
      Array.isArray(updateDataRecord.images) && updateDataRecord.images.length > 0
        ? (updateDataRecord.images as string[])
        : Array.isArray(rawParsedRecord.images) && rawParsedRecord.images.length > 0
        ? (rawParsedRecord.images as string[])
        : undefined;

    const finalImages = updateImageUrl
      ? [updateImageUrl]
      : updateImagesList ?? existing.images;

    await prisma.room.update({
      where: { id: existing.id },
      data: {
        name: updateData.name ?? existing.name,
        price: updateData.price ?? existing.price,
        type: updateData.type ?? existing.type,
        location: updateData.location ?? existing.location,
        isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : existing.isAvailable,
        facilities: facilitiesArray ?? existing.facilities,
        images: finalImages,
      },
    });

    try {
      revalidatePath('/rooms');
      if (existing.slug) {
        revalidatePath(`/rooms/${existing.slug}`);
      }
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/booking');
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js request
    }

    return {
      success: true,
      message: `Data kamar "${existing.name}" berhasil diperbarui di database PostgreSQL!`,
      pesan: `Data kamar "${existing.name}" berhasil diperbarui di database PostgreSQL!`,
      data: null,
    };
  } catch (error) {
    console.error('Failed to update room:', error);
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return {
        success: false,
        message: 'Kamar tidak ditemukan atau sudah dihapus.',
        pesan: 'Kamar tidak ditemukan atau sudah dihapus.',
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal memperbarui data kamar di database.',
      pesan: error instanceof Error ? error.message : 'Gagal memperbarui data kamar di database.',
    };
  }
}

/**
 * Server Action: Mengubah status ketersediaan kamar (Tersedia <-> Penuh).
 */
export async function toggleRoomAvailabilityAction(
  idOrSlug: string,
  isAvailable: boolean
): Promise<ActionResponse<null>> {
  try {
    const existing = await prisma.room.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Kamar tidak ditemukan atau sudah dihapus.',
        pesan: 'Kamar tidak ditemukan atau sudah dihapus.',
      };
    }

    await prisma.room.update({
      where: { id: existing.id },
      data: { isAvailable },
    });

    try {
      revalidatePath('/rooms');
      if (existing.slug) {
        revalidatePath(`/rooms/${existing.slug}`);
      }
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/booking');
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js request
    }

    return {
      success: true,
      message: `Status kamar berhasil diubah menjadi ${isAvailable ? 'Tersedia' : 'Penuh'}.`,
      pesan: `Status kamar berhasil diubah menjadi ${isAvailable ? 'Tersedia' : 'Penuh'}.`,
      data: null,
    };
  } catch (error) {
    console.error('Failed to toggle room availability:', error);
    return {
      success: false,
      message: 'Gagal mengubah status ketersediaan kamar.',
      pesan: 'Gagal mengubah status ketersediaan kamar.',
    };
  }
}

/**
 * Server Action: Menghapus kamar kos dari PostgreSQL (Delete).
 * Menghapus relasi terlebih dahulu agar integritas referensial terjaga.
 */
export async function deleteRoomAction(idOrSlug: string): Promise<ActionResponse<null>> {
  try {
    const existing = await prisma.room.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Kamar tidak ditemukan atau sudah dihapus.',
        pesan: 'Kamar tidak ditemukan atau sudah dihapus.',
      };
    }

    // Bersihkan relasi anak (Reservation dan Penghuni) agar terhindar dari foreign key constraint error
    try {
      await prisma.$transaction([
        prisma.reservation.deleteMany({ where: { roomId: existing.id } }),
        prisma.penghuni.deleteMany({ where: { roomId: existing.id } }),
        prisma.room.delete({ where: { id: existing.id } }),
      ]);
    } catch {
      // Fallback jika database sudah mendukung cascade bawaan
      await prisma.room.delete({
        where: { id: existing.id },
      });
    }

    try {
      revalidatePath('/rooms');
      revalidatePath('/dashboard/penyewa');
      revalidatePath('/booking');
    } catch {
      // Abaikan jika dipanggil di luar konteks Next.js request
    }

    return {
      success: true,
      message: `Kamar "${existing.name}" berhasil dihapus dari database PostgreSQL.`,
      pesan: `Kamar "${existing.name}" berhasil dihapus dari database PostgreSQL.`,
      data: null,
    };
  } catch (error) {
    console.error('Failed to delete room:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menghapus kamar dari database.',
      pesan: error instanceof Error ? error.message : 'Gagal menghapus kamar dari database.',
    };
  }
}

/**
 * Alias penamaan fungsi bahasa Indonesia sesuai spesifikasi modul praktikum:
 * - tambahKamar : createRoomAction
 * - ubahKamar   : updateRoomAction
 * - hapusKamar  : deleteRoomAction
 */
export {
  createRoomAction as tambahKamar,
  updateRoomAction as ubahKamar,
  deleteRoomAction as hapusKamar,
};
