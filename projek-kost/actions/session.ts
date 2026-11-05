'use server';

import { simpanSesi, bacaSesi, hapusSesi } from '@/lib/session';
import { roomSchema } from '@/lib/validations/room';
import { createRoomAction } from '@/actions/room';

export interface SessionActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | undefined>;
}

/**
 * Server Action: Membuat sesi baru setelah login sah
 */
export async function buatSesiAction(email: string, role: string = 'admin'): Promise<SessionActionResult<string>> {
  try {
    const uuid = await simpanSesi(email, role);
    return {
      success: true,
      message: 'Sesi server berhasil dibuat.',
      data: uuid,
    };
  } catch (error) {
    console.error('Error saat membuat sesi:', error);
    return {
      success: false,
      message: 'Gagal membuat sesi di server.',
    };
  }
}

/**
 * Server Action: Mencabut sesi server dan menghapus cookie (Logout)
 */
export async function hapusSesiAction(): Promise<SessionActionResult> {
  try {
    await hapusSesi();
    return {
      success: true,
      message: 'Sesi berhasil dicabut dari server dan cookie dihapus.',
    };
  } catch (error) {
    console.error('Error saat menghapus sesi:', error);
    return {
      success: false,
      message: 'Gagal mencabut sesi.',
    };
  }
}

/**
 * Server Action: Memeriksa validitas sesi saat ini
 */
export async function periksaSesiAction(): Promise<{ isValid: boolean; email?: string }> {
  const sesi = await bacaSesi();
  if (!sesi) {
    return { isValid: false };
  }
  return { isValid: true, email: sesi.email };
}

/**
 * Server Action: Menambahkan item katalog baru (/katalog/tambah).
 * Memvalidasi apakah pemanggil memiliki sesi server yang sah (bacaSesi).
 * Jika sesi palsu / tidak sah, menolak dengan pesan: "Silakan masuk terlebih dahulu."
 */
export async function tambahItemKatalogAction(rawData: unknown): Promise<SessionActionResult> {
  // 1. Verifikasi Sesi Server (Pemeriksaan Kunci UUID terhadap Map Server)
  const sesi = await bacaSesi();

  if (!sesi) {
    return {
      success: false,
      message: 'Silakan masuk terlebih dahulu.',
    };
  }

  // 2. Validasi Input Item via Zod
  const validation = roomSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstErrorMessage =
      fieldErrors.description?.[0] ||
      fieldErrors.name?.[0] ||
      fieldErrors.type?.[0] ||
      fieldErrors.price?.[0] ||
      'Data item belum lengkap atau format tidak sesuai.';

    return {
      success: false,
      message: firstErrorMessage,
      errors: fieldErrors,
    };
  }

  // 3. Simpan ke Database
  const res = await createRoomAction(rawData);
  return {
    success: res.success,
    message: res.message,
    errors: res.errors,
    data: res.data,
  };
}
