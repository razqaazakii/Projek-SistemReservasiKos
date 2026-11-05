import { z } from 'zod';
import { isValidFullName, isValidIndonesianPhone } from './booking';

// Daftar kata kunci terlarang (dokumen yang jelas BUKAN KTP)
export const NON_KTP_KEYWORDS = [
  'peta',
  'matriks',
  'matrix',
  'diagram',
  'flowchart',
  'skema',
  'tugas',
  'modul',
  'laporan',
  'screenshot',
  'tangkapan',
  'wa_image',
  'pemandangan',
  'wallpaper',
  'avatar',
  'profil',
  'profile',
  'kucing',
  'anjing',
  'cat',
  'dog',
  'banner',
  'poster',
  'slide',
  'ppt',
  'pdf',
  'excel',
  'word',
  'doc',
  'cv',
  'resume',
  'surat',
];

// Daftar kata kunci identifikasi KTP valid
export const KTP_VALID_KEYWORDS = [
  'ktp',
  'e-ktp',
  'ektp',
  'identitas',
  'dukcapil',
  'kartu_tanda_penduduk',
  'kartu-tanda-penduduk',
  'nik',
];

/**
 * Validasi apakah sebuah nama file atau metadata merupakan foto KTP yang sah
 */
export function validateKtpDocument(fileName: string): { isValid: boolean; reason?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, reason: 'Berkas KTP belum dipilih.' };
  }

  const cleanName = fileName.toLowerCase().trim();

  // 1. Cek ekstensi file gambar
  const validExtensions = /\.(jpe?g|png|webp)$/i;
  if (!validExtensions.test(cleanName)) {
    return {
      isValid: false,
      reason: 'Format file tidak didukung. Harap unggah foto KTP berformat JPG, PNG, atau WebP.',
    };
  }

  // 2. Cek apakah ada kata kunci file terlarang / bukan KTP
  for (const keyword of NON_KTP_KEYWORDS) {
    if (cleanName.includes(keyword)) {
      return {
        isValid: false,
        reason: `Berkas '${fileName}' terdeteksi sebagai dokumen non-identitas (${keyword.toUpperCase()}). Harap unggah foto fisik E-KTP resmi Republik Indonesia.`,
      };
    }
  }

  // 3. Cek apakah nama file mengandung indikasi KTP / identitas resmi
  const hasKtpIndicator = KTP_VALID_KEYWORDS.some((kw) => cleanName.includes(kw));
  if (!hasKtpIndicator) {
    return {
      isValid: false,
      reason: `Sistem e-KYC tidak mendeteksi atribut E-KTP pada berkas '${fileName}'. Mohon pastikan file adalah foto E-KTP Anda (contoh: ktp_anda.jpg atau ektp.png).`,
    };
  }

  return { isValid: true };
}

export const registerSchema = z
  .object({
    role: z.enum(['penyewa', 'admin'], {
      required_error: 'Peran akun wajib dipilih.',
    }),
    name: z
      .string({ required_error: 'Nama lengkap wajib diisi.' })
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter.')
      .max(100, 'Nama lengkap maksimal 100 karakter.')
      .refine(isValidFullName, {
        message: 'Nama lengkap hanya boleh berisi huruf (tidak boleh mengandung angka).',
      }),
    email: z
      .string({ required_error: 'Alamat email wajib diisi.' })
      .trim()
      .email('Format alamat email tidak valid.'),
    phone: z
      .string({ required_error: 'Nomor WhatsApp wajib diisi.' })
      .trim()
      .refine(isValidIndonesianPhone, {
        message: 'Format nomor WhatsApp tidak valid (10-14 digit, diawali 08/+628).',
      }),
    password: z
      .string({ required_error: 'Kata sandi wajib diisi.' })
      .min(6, 'Kata sandi minimal 6 karakter.'),
    confirmPassword: z.string().optional(),
    nik: z.string().optional(),
    ktpFileName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Khusus peran Penyewa, wajib menyertakan E-KTP yang valid dan NIK 16 digit
    if (data.role === 'penyewa') {
      if (!data.ktpFileName || data.ktpFileName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ktpFileName'],
          message: 'Foto fisik E-KTP wajib diunggah untuk verifikasi identitas penyewa.',
        });
      } else {
        const ktpCheck = validateKtpDocument(data.ktpFileName);
        if (!ktpCheck.isValid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['ktpFileName'],
            message: ktpCheck.reason || 'Berkas bukan dokumen E-KTP yang sah.',
          });
        }
      }

      if (!data.nik || data.nik.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nik'],
          message: 'Nomor NIK KTP wajib diisi melalui pemindaian foto E-KTP yang valid.',
        });
      } else if (!/^\d{16}$/.test(data.nik.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nik'],
          message: 'Nomor NIK KTP harus tepat 16 digit angka resmi Dukcapil.',
        });
      }
    }

    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi kata sandi tidak cocok.',
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
