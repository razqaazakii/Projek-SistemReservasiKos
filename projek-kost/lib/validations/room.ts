import { z } from 'zod';

export const roomTypeEnum = z.enum(['Putra', 'Putri', 'Campur'], {
  errorMap: () => ({ message: 'Pilih salah satu kategori.' }),
});

export const roomSchema = z.object({
  name: z
    .string({ required_error: 'Judul minimal 3 karakter.' })
    .trim()
    .min(3, 'Judul minimal 3 karakter.')
    .max(100, 'Judul maksimal 100 karakter.'),
  price: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9]/g, '');
        return cleaned ? Number(cleaned) : NaN;
      }
      return val;
    },
    z
      .number({ required_error: 'Harga sewa per bulan wajib diisi.' })
      .min(100000, 'Harga sewa minimal Rp 100.000 per bulan.')
      .max(100000000, 'Harga sewa tidak valid.')
  ),
  type: roomTypeEnum,
  description: z
    .string()
    .trim()
    .min(10, 'Deskripsi minimal 10 karakter.')
    .max(300, 'Deskripsi maksimal 300 karakter.')
    .optional()
    .or(z.literal('')),
  location: z
    .string({ required_error: 'Lokasi kos wajib diisi.' })
    .trim()
    .min(5, 'Lokasi kos minimal 5 karakter untuk kejelasan wilayah.'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isAvailable: z.boolean().default(true),
  facilities: z
    .array(z.string())
    .min(1, 'Minimal cantumkan 1 fasilitas kamar (contoh: AC, WiFi, Kasur).')
    .or(
      z.string().transform((val) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ),
  imageUrl: z
    .string()
    .trim()
    .url('Format URL gambar tidak valid.')
    .optional()
    .or(z.literal('')),
  images: z
    .array(z.string())
    .optional()
    .default([]),
});

export type RoomInput = z.infer<typeof roomSchema>;
