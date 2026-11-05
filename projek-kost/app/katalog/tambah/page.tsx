'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tambahItemKatalogAction, hapusSesiAction, periksaSesiAction } from '@/actions/session';

export default function TambahKatalogPage() {
  const router = useRouter();

  // State Form
  const [formData, setFormData] = useState({
    name: 'Kost Griya Eksklusif Mahasiswa',
    price: '1850000',
    type: 'Campur',
    location: 'Kebayoran Baru, Jakarta Selatan',
    description: 'Kamar kos fully furnished nyaman dengan AC, WiFi, dan kamar mandi dalam.',
    facilities: 'AC, WiFi Cepat, Kamar Mandi Dalam, Kasur Springbed',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({});

  // Verifikasi Sesi Server saat halaman pertama kali diakses langsung (Kriteria 5)
  useEffect(() => {
    periksaSesiAction().then((res) => {
      if (!res.isValid) {
        // Jika sesi lama / palsu saat navigasi langsung, alihkan ke /masuk
        router.push('/masuk?redirect=/katalog/tambah');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setFormErrors({});

    try {
      const res = await tambahItemKatalogAction(formData);

      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Item berhasil disimpan ke katalog!' });
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        }
        setMessage({ type: 'error', text: res.message || 'Gagal menyimpan item ke katalog.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await hapusSesiAction();
      // Bersihkan juga sesi klien agar sinkron
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('rstay_session_token');
        document.cookie = 'sesi=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'rstay_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      }
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Formulir Katalog
              </span>
              <span className="text-xs text-slate-500 font-mono">/katalog/tambah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              Tambah Item Kamar Kos
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Data yang dikirim akan diverifikasi oleh Server Action menggunakan fungsi validasi sesi server.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Beranda
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors border border-red-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? 'Mencabut Sesi...' : 'Keluar / Logout'}
            </button>
          </div>
        </div>

        {/* Notifikasi Status / Pesan Penolakan Server */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm font-semibold shadow-xs animate-in fade-in ${
              message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <p className="font-bold">
              {message.type === 'error' ? 'Penolakan Sisi Server' : 'Operasi Berhasil'}
            </p>
            <p className="text-xs mt-0.5 font-normal">{message.text}</p>
          </div>
        )}

        {/* Form Tambah Item */}
        <form onSubmit={handleSubmit} noValidate className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Judul / Nama Item */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Nama / Judul Kamar Kos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, name: val });
                const trimmedLower = val.trim().toLowerCase();
                const isDup =
                  trimmedLower === 'kost griya asri deluxe' ||
                  trimmedLower === 'kost ajolie executive' ||
                  trimmedLower === 'kost putri melati cantika';

                if (isDup) {
                  setFormErrors((prev) => ({
                    ...prev,
                    name: ['Judul sudah dipakai item lain.'],
                  }));
                } else if (trimmedLower.length > 0 && trimmedLower.length < 3) {
                  setFormErrors((prev) => ({
                    ...prev,
                    name: ['Judul minimal 3 karakter.'],
                  }));
                } else {
                  setFormErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.name;
                    return copy;
                  });
                }
              }}
              onBlur={() => {
                const trimmedLower = formData.name.trim().toLowerCase();
                const isDup =
                  trimmedLower === 'kost griya asri deluxe' ||
                  trimmedLower === 'kost ajolie executive' ||
                  trimmedLower === 'kost putri melati cantika';

                if (isDup) {
                  setFormErrors((prev) => ({
                    ...prev,
                    name: ['Judul sudah dipakai item lain.'],
                  }));
                } else if (trimmedLower.length > 0 && trimmedLower.length < 3) {
                  setFormErrors((prev) => ({
                    ...prev,
                    name: ['Judul minimal 3 karakter.'],
                  }));
                }
              }}
              placeholder="Contoh: Kost Griya Asri Deluxe"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                formErrors.name
                  ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {formErrors.name && (
              <p className="text-xs text-red-600 mt-1 font-semibold animate-in fade-in">
                {formErrors.name[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Harga */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Harga Sewa / Bulan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {formErrors.price && (
                <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.price[0]}</p>
              )}
            </div>

            {/* Kategori */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Kategori Tipe Kos <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Campur">Campur</option>
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
              </select>
              {formErrors.type && (
                <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.type[0]}</p>
              )}
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Lokasi Alamat Kos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {formErrors.location && (
              <p className="text-xs text-red-600 mt-1 font-medium">{formErrors.location[0]}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">
                Deskripsi Item Kamar <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono transition-colors ${
                  formData.description.trim().length > 0 && formData.description.trim().length < 10
                    ? 'text-red-600 font-bold'
                    : formData.description.length > 300
                    ? 'text-red-600 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {formData.description.length} / 300 karakter (min. 10)
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, description: val });
                const trimmed = val.trim();
                if (trimmed.length > 0 && trimmed.length < 10) {
                  setFormErrors((prev) => ({
                    ...prev,
                    description: ['Deskripsi minimal 10 karakter.'],
                  }));
                } else if (val.length > 300) {
                  setFormErrors((prev) => ({
                    ...prev,
                    description: ['Deskripsi maksimal 300 karakter.'],
                  }));
                } else {
                  setFormErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.description;
                    return copy;
                  });
                }
              }}
              onBlur={() => {
                const trimmed = formData.description.trim();
                if (trimmed.length > 0 && trimmed.length < 10) {
                  setFormErrors((prev) => ({
                    ...prev,
                    description: ['Deskripsi minimal 10 karakter.'],
                  }));
                } else if (trimmed.length === 0) {
                  setFormErrors((prev) => ({
                    ...prev,
                    description: ['Deskripsi minimal 10 karakter.'],
                  }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                formErrors.description
                  ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />
            {formErrors.description && (
              <p className="text-xs text-red-600 mt-1 font-medium animate-in fade-in">
                {formErrors.description[0]}
              </p>
            )}
          </div>

          {/* Tombol Simpan */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
