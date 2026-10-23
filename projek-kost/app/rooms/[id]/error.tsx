'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RoomDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error ke konsol untuk keperluan debugging teknis
    console.error('Room Detail Boundary Error:', error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8 sm:p-10 text-center">
        {/* Ikon Error */}
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-5 text-rose-600">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Label & Pesan */}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 mb-3 border border-rose-100">
          Runtime Error Boundary
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Gagal Memuat Detail Kamar
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Terjadi kendala teknis saat memproses informasi kamar. Anda dapat mencoba memuat ulang segmen ini tanpa me-refresh seluruh halaman.
        </p>

        {/* Informasi Error Ringkas (untuk pembuktian dev) */}
        {error?.message && (
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 font-mono overflow-x-auto">
            <span className="text-slate-400 select-none">$ </span>
            {error.message}
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 cursor-pointer"
          >
            Coba Muat Ulang (Reset)
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
