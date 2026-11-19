'use client';

import React, { useState } from 'react';

export default function FormUlasan({ itemId }: { itemId: string | number }) {
  const [isi, setIsi] = useState('');
  const [rating, setRating] = useState(5);
  const [pesan, setPesan] = useState('');

  // Perbaikan Modul 7: Nilai turunan dihitung langsung saat proses render (derived state)
  // Menghilangkan useEffect([]) yang menyebabkan penghitung karakter macet di 280
  const sisa = 280 - isi.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isi.trim()) return;
    setPesan('Terima kasih! Ulasan kamar berhasil dikirim.');
    setIsi('');
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Beri Ulasan Kamar Kos</h2>
      <p className="text-xs text-slate-500 mb-4 font-mono">
        Komponen: components/FormUlasan.tsx (Ref Kamar: {itemId})
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="isi-ulasan" className="block text-sm font-semibold text-slate-800 mb-1">
            Ulasan Anda
          </label>
          <textarea
            id="isi-ulasan"
            name="isi"
            rows={3}
            maxLength={280}
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder="Tuliskan pengalaman atau fasilitas kos ini..."
            className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-between items-center mt-1.5">
            <p className="text-xs font-semibold text-slate-600">
              <span className={sisa < 20 ? 'text-amber-600 font-bold' : 'text-blue-600'}>
                {sisa}
              </span>{' '}
              karakter tersisa
            </p>
            <span className="text-xs text-slate-400">Maksimal 280 karakter</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="rating-ulasan" className="block text-xs font-semibold text-slate-700 mb-1">
              Rating Kepuasan (1 - 5)
            </label>
            <input
              id="rating-ulasan"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          <button
            type="submit"
            className="mt-5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm"
          >
            Kirim Ulasan
          </button>
        </div>

        {pesan && (
          <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            ✓ {pesan}
          </p>
        )}
      </form>
    </div>
  );
}

FormUlasan.displayName = 'FormUlasan';

