'use server';

import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth';

export interface RegisterActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  data?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Server Action: Mendaftarkan akun pengguna baru langsung ke database PostgreSQL
 * Terintegrasi dengan Validasi Sisi Server (Zod) untuk e-KYC E-KTP dan data diri.
 */
export async function registerUserAction(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
  nik?: string;
  ktpFileName?: string;
}): Promise<RegisterActionResult> {
  try {
    // 1. Validasi Sisi Server menggunakan Skema Zod
    const normalizedRole = data.role?.toLowerCase() === 'admin' ? 'admin' : 'penyewa';
    const validationResult = registerSchema.safeParse({
      ...data,
      role: normalizedRole,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = err.message;
        }
      });
      const firstErrorMessage =
        validationResult.error.errors[0]?.message || 'Validasi pendaftaran gagal.';

      return {
        success: false,
        message: firstErrorMessage,
        errors: fieldErrors,
      };
    }

    const cleanEmail = data.email.trim().toLowerCase();

    // 2. Cek apakah email sudah terdaftar di database
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'Alamat email ini sudah terdaftar di database.',
      };
    }

    // 3. Simpan user baru ke tabel User PostgreSQL
    const roleUpper = normalizedRole === 'admin' ? 'ADMIN' : 'PENYEWA';

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        phone: data.phone.trim(),
        password: data.password,
        role: roleUpper,
      },
    });

    return {
      success: true,
      message: 'Akun berhasil didaftarkan ke PostgreSQL!',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  } catch (error) {
    console.error('Failed to register user to PostgreSQL:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menyimpan akun ke database.',
    };
  }
}

/**
 * Server Action: Mencari user di PostgreSQL berdasarkan email/no telp untuk login
 */
export async function findUserByEmailAction(emailOrPhone: string) {
  try {
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanDigits = emailOrPhone.trim().replace(/\D/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          ...(cleanDigits.length >= 8 ? [{ phone: cleanDigits }] : []),
        ],
      },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('Failed to find user:', error);
    return { success: false, data: null };
  }
}

/**
 * Server Action: Update data profil pengguna di database PostgreSQL
 */
export async function updateUserProfileDbAction(currentEmail: string, data: {
  name: string;
  email: string;
  phone: string;
}) {
  try {
    const cleanCurrent = currentEmail.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanCurrent },
    });

    if (!existing) {
      return { success: false, message: 'Data pengguna tidak ditemukan di PostgreSQL.' };
    }

    // Jika email diubah, pastikan email baru belum dipakai user lain
    const newEmail = data.email.trim().toLowerCase();
    if (newEmail !== cleanCurrent) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: newEmail },
      });
      if (emailTaken) {
        return { success: false, message: 'Alamat email baru tersebut sudah digunakan oleh akun lain.' };
      }
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: data.name.trim(),
        email: newEmail,
        phone: data.phone.trim(),
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Failed to update user profile in PostgreSQL:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal memperbarui data di database.',
    };
  }
}
