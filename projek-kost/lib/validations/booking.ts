import { z } from 'zod';

export function isValidFullName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;

  // Pola nama: hanya huruf alfabet dan spasi
  const validNameRegex = /^[a-zA-Z\s]+$/;
  return validNameRegex.test(trimmed);
}

export function isValidIndonesianPhone(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  // 1. Bersihkan spasi dan tanda minus
  const cleanNumber = value.trim().replace(/[\s-]/g, '');

  // 2. Cek apakah memiliki awalan nomor Indonesia yang valid
  const hasValidPrefix =
    cleanNumber.startsWith('08') ||
    cleanNumber.startsWith('628') ||
    cleanNumber.startsWith('+628');

  if (!hasValidPrefix) {
    return false;
  }

  // 3. Ambil bagian angka murni (buang tanda '+' di depan jika ada)
  const numericOnly = cleanNumber.startsWith('+')
    ? cleanNumber.slice(1)
    : cleanNumber;

  // Pastikan semuanya hanya terdiri dari digit angka 0-9
  const isAllDigits = /^\d+$/.test(numericOnly);
  if (!isAllDigits) {
    return false;
  }

  // 4. Cek panjang digit angka (standar provider Indonesia: 10 - 14 digit)
  const isLengthValid = numericOnly.length >= 10 && numericOnly.length <= 14;

  return isLengthValid;
}

export const bookingSchema = z.object({
  roomId: z
    .string({
      required_error: 'Kamar wajib dipilih.',
      invalid_type_error: 'ID Kamar harus berupa teks.',
    })
    .min(1, 'Silakan pilih kamar yang ingin Anda pesan.'),

  fullName: z
    .string({
      required_error: 'Nama lengkap wajib diisi.',
      invalid_type_error: 'Nama lengkap harus berupa teks.',
    })
    .trim()
    .min(3, 'Nama lengkap minimal harus 3 karakter.')
    .max(100, 'Nama lengkap maksimal 100 karakter.')
    .refine(isValidFullName, {
      message:
        'Nama lengkap hanya boleh berisi huruf alfabet dan spasi (sesuai standar KTP).',
    }),

  email: z
    .string({
      required_error: 'Alamat email wajib diisi.',
      invalid_type_error: 'Alamat email harus berupa teks.',
    })
    .trim()
    .email('Format alamat email tidak valid (contoh: user@domain.com).'),

  whatsapp: z
    .string({
      required_error: 'Nomor WhatsApp wajib diisi.',
      invalid_type_error: 'Nomor WhatsApp harus berupa teks.',
    })
    .trim()
    .refine(isValidIndonesianPhone, {
      message:
        'Nomor WhatsApp harus diawali 08/+628 dan terdiri dari 10–14 digit angka.',
    }),

  checkInDate: z
    .string({
      required_error: 'Tanggal mulai masuk wajib dipilih.',
      invalid_type_error: 'Tanggal harus berupa format teks tanggal yang valid.',
    })
    .min(1, 'Tanggal mulai sewa wajib dipilih.')
    .refine(
      (val) => {
        if (!val) return false;
        const selected = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
      },
      {
        message: 'Tanggal mulai masuk tidak boleh di masa lalu.',
      }
    ),

  duration: z.coerce
    .number({
      required_error: 'Durasi sewa wajib dipilih.',
      invalid_type_error: 'Durasi sewa harus berupa angka bulan.',
    })
    .refine((val) => [1, 3, 6, 12].includes(val), {
      message: 'Pilihan durasi sewa harus 1, 3, 6, atau 12 bulan.',
    }),

  notes: z
    .string()
    .max(500, 'Catatan tambahan maksimal 500 karakter.')
    .optional()
    .or(z.literal('')),
});

export type BookingInput = z.infer<typeof bookingSchema>;
