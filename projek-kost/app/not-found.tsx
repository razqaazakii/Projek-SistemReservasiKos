import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Badge Kode Status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 mb-6">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          HTTP 404: Not Found
        </div>

        {/* Judul & Ilustrasi Visual */}
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight sm:text-7xl">
          404
        </h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 tracking-tight">
          Halaman atau Kamar Tidak Ditemukan
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Maaf, kamar kos yang Anda cari tidak terdaftar dalam sistem kami atau rute URL yang dituju salah. Silakan periksa kembali tautan Anda.
        </p>

        {/* Aksi Navigasi */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Kembali ke Katalog Kos
          </Link>
          <Link
            href="/dashboard/penyewa"
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
