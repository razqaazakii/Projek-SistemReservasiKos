'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { buatSesiAction } from '@/actions/session';
import { setAuthUser } from '@/lib/auth';

function MasukContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/katalog/tambah';

  const [email, setEmail] = useState('admin@rstay.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (password !== 'admin123' && password !== 'penyewa123') {
        setErrorMsg('Email atau kata sandi salah.');
        setIsLoading(false);
        return;
      }

      // 1. Buat Sesi Server Resmi (Map Storage & Cookie 'sesi')
      const res = await buatSesiAction(email, email.includes('admin') ? 'admin' : 'penyewa');

      if (!res.success) {
        setErrorMsg(res.message);
        setIsLoading(false);
        return;
      }

      // 2. Simpan juga sesi klien agar sinkron dengan auth lokal
      setAuthUser({
        name: email.includes('admin') ? 'Pengelola Kos R-Stay' : 'Ahmad Fauzi',
        email,
        role: email.includes('admin') ? 'admin' : 'penyewa',
      });

      // 3. Arahkan ke rute target
      router.push(redirectTarget);
    } catch {
      setErrorMsg('Terjadi kesalahan saat masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-900 text-white flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="text-xl font-extrabold text-slate-900">
              R<span className="text-cyan-900">-Stay</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Masuk ke Akun
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Akses rute terlindungi <span className="font-mono font-semibold">/katalog/tambah</span> untuk menguji sesi cookie.
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Demo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi Demo
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-800"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-900 hover:bg-cyan-950 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Memverifikasi Sesi...' : 'Masuk dan Buat Cookie Sesi'}
            </button>
          </form>

          {/* Tombol Cepat Akun Demo */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 mb-2 font-medium">
              Gunakan akun demo yang telah disediakan:
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@rstay.com');
                setPassword('admin123');
              }}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold text-left transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>Admin (admin@rstay.com)</span>
              <span className="text-[10px] text-slate-400 font-mono">admin123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <MasukContent />
    </Suspense>
  );
}
